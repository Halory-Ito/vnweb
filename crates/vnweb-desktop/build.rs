fn main() {
    let manifest = tauri_build::AppManifest::new().commands(&["save_export", "pick_game_path"]);
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(manifest))
        .expect("failed to build Tauri application");
}
