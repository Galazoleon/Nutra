import Foundation

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

    /// Sends a meal photo, gets back a plain description like "2 eggs, toast, coffee",
    /// which then goes through the same parser as typed text.
    // NEEDS: deployed Supabase `analyze-meal` function and the provider key as a server secret.
    static func describeMealPhoto(_ jpeg: Data) async -> String? {
        struct Reply: Decodable { var description: String }
        let body = ["imageBase64": jpeg.base64EncodedString()]
        let reply: Reply? = await post("analyze-meal", body: body)
        return reply?.description
    }

    /// Live AI coach answer. Returns nil when the server is not set up.
    // NEEDS: deployed Supabase `coach` function and the provider key as a server secret.
    static func askCoach(_ question: String, context: String) async -> String? {
        struct Reply: Decodable { var answer: String }
        let reply: Reply? = await post("coach", body: ["question": question, "context": context])
        return reply?.answer
    }

    private static func post<T: Decodable>(_ function: String, body: [String: String]) async -> T? {
        guard let baseURL else { return nil }
        var request = URLRequest(url: baseURL.appending(path: "functions/v1/\(function)"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 30
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
