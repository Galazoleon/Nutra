import SwiftUI
import PhotosUI
import NutraCore

/// Logging, simplified: one box to describe the meal, three ways to fill it.
/// Every path ends on the same review screen.
struct LogView: View {
    @Environment(AppStore.self) private var store
    var onSaved: () -> Void

    @State private var text = ""
    @State private var review: ReviewDraft?
    @State private var photoItem: PhotosPickerItem?
    @State private var photoStatus: String?
    @State private var showSpeakTip = false
    @FocusState private var textFocused: Bool

    var body: some View {
        NavigationStack {
            ScreenScroll {
                Text("What did you eat?").font(.largeTitle.bold())

                TextField("For example: 2 eggs, toast and a coffee", text: $text, axis: .vertical)
                    .lineLimit(3...6)
                    .focused($textFocused)
                    .padding(14)
                    .background(Theme.card, in: RoundedRectangle(cornerRadius: Theme.corner, style: .continuous))
                    .accessibilityLabel("Describe your meal")

                HStack(spacing: 12) {
                    Button {
                        showSpeakTip = true
                        textFocused = true
                    } label: {
                        Label("Speak", systemImage: "mic")
                    }
                    .buttonStyle(.secondary)

                    PhotosPicker(selection: $photoItem, matching: .images) {
                        Label("Photo", systemImage: "camera")
                    }
                    .buttonStyle(.secondary)
                }

                if showSpeakTip {
                    Text("Tap the microphone on your keyboard and say what you ate.")
                        .font(.footnote).foregroundStyle(.secondary)
                }
                if let photoStatus {
                    HeadsUp(title: "Photo", message: photoStatus, systemImage: "camera")
                }

                Button("Review meal") { openReview(source: .typed) }
                    .buttonStyle(.primary)
                    .disabled(text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

                if !recentMeals.isEmpty {
                    Text("Have it again").font(.title3.bold()).padding(.top, 8)
                    ForEach(recentMeals) { meal in
                        Button {
                            review = ReviewDraft(items: meal.items.map { LoggedItem(food: $0.food, portions: $0.portions) },
                                                 unrecognized: [], source: .typed)
                        } label: {
                            HStack {
                                Text(meal.title).multilineTextAlignment(.leading)
                                Spacer()
                                Image(systemName: "arrow.uturn.left").foregroundStyle(Theme.indigo)
                            }
                            .frame(minHeight: Theme.tap)
                            .padding(.horizontal, 14)
                            .background(Theme.card, in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                        }
                        .buttonStyle(.plain)
                        .accessibilityHint("Opens this meal to review and save again")
                    }
                }
            }
            .toolbar(.hidden, for: .navigationBar)
            .onChange(of: photoItem) { _, item in
                guard let item else { return }
                Task { await handlePhoto(item) }
            }
            .fullScreenCover(item: $review) { draft in
                MealReviewView(draft: draft) { saved in
                    review = nil
                    if saved {
                        text = ""
                        photoStatus = nil
                        onSaved()
                    }
                }
                .environment(store)
            }
        }
    }

    /// The last few different meals, for one-tap repeat logging.
    private var recentMeals: [MealEntry] {
        var seen = Set<String>()
        return store.meals.filter { seen.insert($0.title).inserted }.prefix(3).map { $0 }
    }

    private func openReview(source: LogSource) {
        let result = store.parser.parse(text)
        review = ReviewDraft(items: result.items, unrecognized: result.unrecognized, source: source)
    }

    private func handlePhoto(_ item: PhotosPickerItem) async {
        photoStatus = "Looking at your photo…"
        let data = try? await item.loadTransferable(type: Data.self)
        photoItem = nil
        guard let data, let jpeg = BackendService.uploadJPEG(from: data) else {
            photoStatus = "Nutra couldn't open that photo. Try another, or type what's in it."
            return
        }
        if !BackendService.isConfigured {
            // NEEDS: NutraBackendURL in project.yml once the Supabase analyze-meal function is deployed.
            photoStatus = "Photo reading isn't switched on yet. Type what's in the photo above and tap Review."
            textFocused = true
            return
        }
        if let description = await BackendService.describeMealPhoto(jpeg) {
            text = description
            photoStatus = Disclaimers.photoEstimate
            openReview(source: .photo)
        } else {
            photoStatus = "Nutra couldn't read that photo right now. Type what's in it above and tap Review."
            textFocused = true
        }
    }
}

/// What the review screen starts with.
struct ReviewDraft: Identifiable {
    let id = UUID()
    var items: [LoggedItem]
    var unrecognized: [String]
    var source: LogSource
}
