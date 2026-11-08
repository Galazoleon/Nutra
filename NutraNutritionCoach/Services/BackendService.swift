import Foundation
import UIKit

/// Talks to Nutra's server functions (Supabase). The app NEVER holds an AI key:
/// the key is a server secret, and the app only calls the function URL.
///
/// Set `NutraBackendURL` in Info.plist (project.yml) to turn this on.
/// Until then every call returns nil and the app falls back to on-device features.
enum BackendService {
    static var baseURL: URL? {
        guard let text = Bundle.main.object(forInfoDictionaryKey: "NutraBackendURL") as? String,
              !text.isEmpty else { return nil }
        return URL(string: text)
    }

    static var isConfigured: Bool { baseURL != nil }

    /// Supabase's public "anon" key. Safe to ship in an app (it is not the AI key).
    /// Only needed if JWT verification is left on for the functions.
    static var anonKey: String? {
        guard let text = Bundle.main.object(forInfoDictionaryKey: "NutraBackendAnonKey") as? String,
              !text.isEmpty else { return nil }
        return text
    }

    /// Shrinks any photo (including iPhone HEIC) to a JPEG no larger than 1568 px on its long side.
    @MainActor
    static func uploadJPEG(from imageData: Data) -> Data? {
        guard let image = UIImage(data: imageData) else { return nil }
        let longest = max(image.size.width, image.size.height)
        let scale = longest > 1568 ? 1568 / longest : 1
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
        return resized.jpegData(compressionQuality: 0.7)
    }

    /// Sends a meal photo, gets back a plain description like "2 eggs, toast, coffee",
    /// which then goes through the same parser as typed text.
    // NEEDS: deployed Supabase `analyze-meal` function and the provider key as a server secret.
    static func describeMealPhoto(_ jpeg: Data) async -> String? {
        guard isConfigured else { return nil }
        struct Reply: Decodable { var description: String }
        let body = ["imageBase64": jpeg.base64EncodedString()]
        let reply: Reply? = await post("analyze-meal", body: body)
        return reply?.description
    }

    /// Live AI coach answer. Returns nil when the server is not set up.
    // NEEDS: deployed Supabase `coach` function and the provider key as a server secret.
    static func askCoach(_ question: String, context: String, gentle: Bool) async -> String? {
        struct Reply: Decodable { var answer: String }
        let reply: Reply? = await post("coach", body: [
            "question": question, "context": context, "gentle": gentle ? "true" : "false"
        ])
        return reply?.answer
    }

    private static func post<T: Decodable>(_ function: String, body: [String: String]) async -> T? {
        guard let baseURL else { return nil }
        var request = URLRequest(url: baseURL.appending(path: "functions/v1/\(function)"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let anonKey {
            request.setValue("Bearer \(anonKey)", forHTTPHeaderField: "Authorization")
            request.setValue(anonKey, forHTTPHeaderField: "apikey")
        }
        request.timeoutInterval = 60
        do {
            request.httpBody = try JSONEncoder().encode(body)
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return nil }
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            return nil
        }
    }
}
