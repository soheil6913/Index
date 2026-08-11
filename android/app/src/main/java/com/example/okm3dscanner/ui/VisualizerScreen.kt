package com.example.ui

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.ViewInAr
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.theme.CardBg
import com.example.ui.theme.CyberCyan
import com.example.ui.theme.CyberGold
import com.example.ui.theme.GrayText

@Composable
fun VisualizerScreen(viewModel: VisualizerViewModel, onNavigateToAi: () -> Unit = {}) {
    val viewedScan by viewModel.viewedScan.collectAsStateWithLifecycle()

    if (viewedScan == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(Icons.Default.ViewInAr, contentDescription = null, tint = CyberGold, modifier = Modifier.size(64.dp))
            Spacer(modifier = Modifier.height(16.dp))
            Text("هیچ اسکن فعالی یافت نشد", color = Color.White, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(
                "لطفاً ابتدا یک اسکن زمین انجام دهید یا یکی از قالب‌های آماده را لود کنید.",
                color = GrayText,
                fontSize = 12.sp,
                textAlign = TextAlign.Center
            )
        }
    } else {
        Box(modifier = Modifier.fillMaxSize()) {
            // ThreeJS WebGL 3D Mesh Engine integrated via WebView
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

            // Overlay HUD Controls
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
                    .align(Alignment.TopCenter),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg.copy(alpha = 0.85f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
                        Text(viewedScan?.name ?: "", color = CyberGold, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                        Text("${viewedScan?.width}×${viewedScan?.length} | ${viewedScan?.soilType}", color = GrayText, fontSize = 10.sp)
                    }
                }

                Button(
                    onClick = onNavigateToAi,
                    colors = ButtonDefaults.buttonColors(containerColor = CyberCyan),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.Black, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(6.dp))
                    Text("آنالیز AI", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
