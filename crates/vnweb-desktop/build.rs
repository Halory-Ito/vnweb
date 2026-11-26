fn main() {
    let manifest = tauri_build::AppManifest::new().commands(&[
        "save_export",
        "pick_game_path",
        "sync_app_branding",
        "get_desktop_runtime_info",
        "restart_desktop_server",
    ]);
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(manifest))
        .expect("failed to build Tauri application");
}
