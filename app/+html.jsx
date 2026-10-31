import { StyleSheet, View } from 'react-native';

export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="theme-color" content="#FF8615" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TuneIt" />
        <meta name="description" content="Your music, your way. Listen to your favorite songs offline with TuneIt." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/tuneit-favicon-48.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/tuneit-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/tuneit-512.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/tuneit-apple-180.png" />
        <title>TuneIt - Offline Music Player</title>
        <style>{'html,body{background:#17171F;margin:0;padding:0;}'}</style>
      </head>
      <body>
        <noscript>Enable JavaScript to run TuneIt.</noscript>
        <View style={styles.root}>{children}</View>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if ('serviceWorker' in navigator) { window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); }); }",
          }}
        />
      </body>
    </html>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#17171F' },
});
