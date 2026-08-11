package com.example.ui

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.theme.CardBg
import com.example.ui.theme.CyberCyan
import com.example.ui.theme.CyberGold
import com.example.ui.theme.GrayText

@Composable
fun MapScreen(viewModel: VisualizerViewModel) {
    val viewedScan by viewModel.viewedScan.collectAsStateWithLifecycle()

    Box(modifier = Modifier.fillMaxSize()) {
        // WebView carrying interactive Leaflet / OpenStreetMap mapping layer
        AndroidView(
            factory = { context ->
                WebView(context).apply {
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    webViewClient = WebViewClient()
                    loadUrl("https://ais-dev-nv5l246zvgkkw3jfiowkmt-248179377299.europe-west2.run.app")
                }
            },
            modifier = Modifier.fillMaxSize()
        )

        // Overlay HUD
        Card(
            colors = CardDefaults.cardColors(containerColor = CardBg.copy(alpha = 0.9f)),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .align(Alignment.TopCenter)
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Icon(Icons.Filled.Public, contentDescription = null, tint = CyberGold, modifier = Modifier.size(18.dp))
                        Text("نقشه آفلاین جغرافیایی (GIS Map)", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Text(
                        viewedScan?.name ?: "موقعیت جغرافیایی فعال",
                        color = GrayText,
                        fontSize = 11.sp
                    )
                }

                viewedScan?.let { scan ->
                    Surface(
                        color = CyberGold.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)) {
                            Icon(Icons.Filled.Place, contentDescription = null, tint = CyberGold, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "${scan.latitude ?: 35.68}, ${scan.longitude ?: 51.38}",
                                color = CyberGold,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    }
}
