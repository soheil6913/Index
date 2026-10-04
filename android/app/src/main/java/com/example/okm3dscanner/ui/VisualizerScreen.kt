package com.example.ui

import android.view.View
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.animation.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.ui.theme.*
import kotlin.math.*

@Composable
fun VisualizerScreen(viewModel: VisualizerViewModel, onNavigateToAi: () -> Unit = {}) {
    val viewedScan by viewModel.viewedScan.collectAsStateWithLifecycle()
    var useThreeJS by remember { mutableStateOf(true) }
    var showHeatmap by remember { mutableStateOf(false) }
    var nativeYaw by remember { mutableStateOf(45f) }
    var nativePitch by remember { mutableStateOf(30f) }
    var nativeZoom by remember { mutableStateOf(1.0f) }
    var nativeZScale by remember { mutableStateOf(1.2f) }

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
        val scan = viewedScan!!

        Box(modifier = Modifier.fillMaxSize().background(DarkBg)) {
            if (useThreeJS) {
                // High-Performance Hardware-Accelerated ThreeJS WebGL 3D Engine
                AndroidView(
                    factory = { context ->
                        WebView(context).apply {
                            setLayerType(View.LAYER_TYPE_HARDWARE, null)
                            settings.apply {
                                javaScriptEnabled = true
                                domStorageEnabled = true
                                databaseEnabled = true
                                allowFileAccess = true
                                allowContentAccess = true
                                loadWithOverviewMode = true
                                useWideViewPort = true
                                setSupportZoom(false)
                                mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                            }
                            webViewClient = object : WebViewClient() {
                                override fun onPageFinished(view: WebView?, url: String?) {
                                    super.onPageFinished(view, url)
                                    val scanJson = org.json.JSONObject().apply {
                                        put("id", scan.id)
                                        put("name", scan.name)
                                        put("width", scan.width)
                                        put("length", scan.length)
                                        put("soilType", scan.soilType)
                                        put("scanPattern", scan.scanPattern)
                                        put("sensorType", scan.sensorType)
                                        put("maxDepthMeters", scan.maxDepthMeters)
                                        put("gridData", org.json.JSONArray(scan.gridData))
                                        put("phaseData", org.json.JSONArray(scan.phaseData))
                                    }.toString()
                                    view?.evaluateJavascript("window.postMessage({ type: 'LOAD_SCAN', scan: $scanJson }, '*');", null)
                                }
                            }
                            webChromeClient = WebChromeClient()
                            loadUrl("https://ais-dev-nv5l246zvgkkw3jfiowkmt-248179377299.europe-west2.run.app/?tab=visualizer&embed=true")
                        }
                    },
                    update = { webView ->
                        val scanJson = org.json.JSONObject().apply {
                            put("id", scan.id)
                            put("name", scan.name)
                            put("width", scan.width)
                            put("length", scan.length)
                            put("soilType", scan.soilType)
                            put("scanPattern", scan.scanPattern)
                            put("sensorType", scan.sensorType)
                            put("maxDepthMeters", scan.maxDepthMeters)
                            put("gridData", org.json.JSONArray(scan.gridData))
                            put("phaseData", org.json.JSONArray(scan.phaseData))
                        }.toString()
                        webView.evaluateJavascript("window.postMessage({ type: 'LOAD_SCAN', scan: $scanJson }, '*');", null)
                    },
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                // Native Offline Compose Isometric 3D Engine
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .pointerInput(Unit) {
                            detectDragGestures { change, dragAmount ->
                                change.consume()
                                nativeYaw = (nativeYaw + dragAmount.x * 0.4f) % 360f
                                nativePitch = (nativePitch + dragAmount.y * 0.3f).coerceIn(10f, 80f)
                            }
                        }
                ) {
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val canvasWidth = size.width
                        val canvasHeight = size.height
                        val centerX = canvasWidth / 2f
                        val centerY = canvasHeight / 2f

                        val cols = scan.width
                        val rows = scan.length
                        val cellSpacing = (min(canvasWidth, canvasHeight) / (max(cols, rows) * 1.5f)) * nativeZoom

                        val radYaw = Math.toRadians(nativeYaw.toDouble())
                        val radPitch = Math.toRadians(nativePitch.toDouble())
                        val cosYaw = cos(radYaw).toFloat()
                        val sinYaw = sin(radYaw).toFloat()
                        val sinPitch = sin(radPitch).toFloat()
                        val cosPitch = cos(radPitch).toFloat()

                        // Function to project 3D (x, y, z) into 2D screen coordinates
                        fun project(x: Float, y: Float, z: Float): Offset {
                            val isoX = (x * cosYaw - y * sinYaw) * cellSpacing
                            val isoY = ((x * sinYaw + y * cosYaw) * sinPitch - z * cosPitch * 1.5f * nativeZScale) * cellSpacing
                            return Offset(centerX + isoX, centerY + isoY)
                        }

                        val halfCols = cols / 2f
                        val halfRows = rows / 2f

                        // Draw Grid & Height Terrain Mesh
                        for (r in 0 until rows - 1) {
                            for (c in 0 until cols - 1) {
                                val idx00 = r * cols + c
                                val idx10 = r * cols + (c + 1)
                                val idx11 = (r + 1) * cols + (c + 1)
                                val idx01 = (r + 1) * cols + c

                                val v00 = (scan.gridData.getOrNull(idx00) ?: 380f)
                                val v10 = (scan.gridData.getOrNull(idx10) ?: 380f)
                                val v11 = (scan.gridData.getOrNull(idx11) ?: 380f)
                                val v01 = (scan.gridData.getOrNull(idx01) ?: 380f)

                                val z00 = (v00 - 380f) / 100f
                                val z10 = (v10 - 380f) / 100f
                                val z11 = (v11 - 380f) / 100f
                                val z01 = (v01 - 380f) / 100f

                                val p00 = project(c - halfCols, r - halfRows, z00)
                                val p10 = project(c + 1 - halfCols, r - halfRows, z10)
                                val p11 = project(c + 1 - halfCols, r + 1 - halfRows, z11)
                                val p01 = project(c - halfCols, r + 1 - halfRows, z01)

                                val avgVal = (v00 + v10 + v11 + v01) / 4f
                                val faceColor = if (showHeatmap) {
                                    when {
                                        avgVal > 750f -> Color(0xFFEF4444).copy(alpha = 0.85f)
                                        avgVal > 550f -> Color(0xFFF97316).copy(alpha = 0.80f)
                                        avgVal > 450f -> Color(0xFFEAB308).copy(alpha = 0.75f)
                                        avgVal > 300f -> Color(0xFF10B981).copy(alpha = 0.70f)
                                        else -> Color(0xFF4F46E5).copy(alpha = 0.80f)
                                    }
                                } else {
                                    when {
                                        avgVal > 750f -> CyberGold.copy(alpha = 0.85f)
                                        avgVal > 550f -> Color(0xFFF59E0B).copy(alpha = 0.75f)
                                        avgVal > 350f -> CyberCyan.copy(alpha = 0.65f)
                                        else -> Color(0xFF3B82F6).copy(alpha = 0.75f)
                                    }
                                }

                                val path = Path().apply {
                                    moveTo(p00.x, p00.y)
                                    lineTo(p10.x, p10.y)
                                    lineTo(p11.x, p11.y)
                                    lineTo(p01.x, p01.y)
                                    close()
                                }

                                drawPath(path, faceColor)
                                drawPath(path, Color.White.copy(alpha = 0.25f), style = Stroke(width = 1.2f))
                            }
                        }
                    }
                }
            }

            // Top Floating Header with Engine Toggle
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp)
                    .align(Alignment.TopCenter),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = SurfaceBg.copy(alpha = 0.9f)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(CyberGold, CircleShape)
                        )
                        Column {
                            Text(scan.name, color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            Text("${scan.width}×${scan.length} | ${scan.soilType}", color = GrayText, fontSize = 9.sp)
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Heatmap Toggle Chip
                    FilterChip(
                        selected = showHeatmap,
                        onClick = { showHeatmap = !showHeatmap },
                        label = { Text("هیت‌مپ", fontSize = 10.sp) },
                        leadingIcon = {
                            Icon(
                                Icons.Default.LocalFireDepartment,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp)
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Color(0xFFEF4444).copy(alpha = 0.3f),
                            selectedLabelColor = Color(0xFFEF4444),
                            selectedLeadingIconColor = Color(0xFFEF4444),
                            containerColor = CardBg,
                            labelColor = Color.White
                        )
                    )

                    // Engine Switcher (WebGL Three.js vs Native Compose)
                    FilterChip(
                        selected = useThreeJS,
                        onClick = { useThreeJS = !useThreeJS },
                        label = { Text(if (useThreeJS) "موتور ThreeJS" else "موتور نیتیو", fontSize = 10.sp) },
                        leadingIcon = {
                            Icon(
                                if (useThreeJS) Icons.Default.ViewInAr else Icons.Default.Tune,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp)
                            )
                        },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CyberCyan.copy(alpha = 0.25f),
                            selectedLabelColor = CyberCyan,
                            selectedLeadingIconColor = CyberCyan,
                            containerColor = CardBg,
                            labelColor = Color.White
                        )
                    )

                    Button(
                        onClick = onNavigateToAi,
                        colors = ButtonDefaults.buttonColors(containerColor = CyberGold),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                    ) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = Color.Black, modifier = Modifier.size(14.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("AI", color = Color.Black, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
