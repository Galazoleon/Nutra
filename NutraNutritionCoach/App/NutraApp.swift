import SwiftUI
import NutraCore

@main
struct NutraApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .tint(Theme.indigo)
                .task { await store.loadData() }
        }
    }
}

/// Decides what to show: loading, setup, or the main app.
struct RootView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        Group {
            if let error = store.loadError {
                ContentUnavailableView("Nutra couldn't load its food data",
                                       systemImage: "exclamationmark.circle",
                                       description: Text(error))
            } else if store.data == nil {
                ProgressView("Getting Nutra ready…")
            } else if !store.profile.completedOnboarding {
                OnboardingView()
            } else {
                MainTabView()
            }
        }
        .background(Theme.background.ignoresSafeArea())
    }
}

/// Four tabs, plain names. Log sits in the middle-left and uses a filled icon to stand out.
struct MainTabView: View {
    enum Tab: Hashable { case today, log, coach, profile }
    @State private var tab: Tab = .today

    var body: some View {
        TabView(selection: $tab) {
            TodayView(openLog: { tab = .log })
                .tabItem { Label("Today", systemImage: "sun.max") }
                .tag(Tab.today)
            LogView(onSaved: { tab = .today })
                .tabItem { Label("Log", systemImage: "plus.circle.fill") }
                .tag(Tab.log)
            CoachView()
                .tabItem { Label("Coach", systemImage: "lightbulb") }
                .tag(Tab.coach)
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person.crop.circle") }
                .tag(Tab.profile)
        }
    }
}
