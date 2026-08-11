package com.example.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ViewInAr
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.ScanRecord
import com.example.ui.theme.CardBg
import com.example.ui.theme.CyberCyan
import com.example.ui.theme.CyberGold
import com.example.ui.theme.GrayText

@Composable
fun HistoryScreen(viewModel: VisualizerViewModel, onLoadScan: (ScanRecord) -> Unit) {
    val savedScans by viewModel.savedScans.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text("تاریخچه اسکن‌های زمین", color = CyberGold, fontSize = 16.sp, fontWeight = FontWeight.Bold)

        Spacer(modifier = Modifier.height(12.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            items(savedScans) { scan ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = CardBg),
                    shape = RoundedCornerShape(14.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(scan.name, color = Color.White, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                            Text("تاریخ: ${scan.date} | ابعاد: ${scan.width}×${scan.length}", color = GrayText, fontSize = 11.sp)
                        }

                        IconButton(onClick = {
                            viewModel.loadScanToVisualizer(scan)
                            onLoadScan(scan)
                        }) {
                            Icon(Icons.Default.ViewInAr, contentDescription = "Load", tint = CyberCyan)
                        }
                    }
                }
            }
        }
    }
}
