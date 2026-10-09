# Keep the JS bridge methods reachable from WebView.
-keepclassmembers class com.lifeos.app.MainActivity$Bridge {
    public *;
}
