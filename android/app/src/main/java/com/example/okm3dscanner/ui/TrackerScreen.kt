package com.example.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
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
import com.example.ui.theme.CardBg
import com.example.ui.theme.CyberCyan
import com.example.ui.theme.CyberGold
import com.example.ui.theme.GrayText

@Composable
fun TrackerScreen(viewModel: VisualizerViewModel) {
    val adcValue by viewModel.sensorManager.adcValue.collectAsStateWithLifecycle()
    val phaseShift by viewModel.sensorManager.phaseShift.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("ردیاب زنده مگنتومتر (Live Magnetometer Pinpointer)", color = CyberGold, fontSize = 16.sp, fontWeight = FontWeight.Bold)

        Card(
            colors = CardDefaults.cardColors(containerColor = CardBg),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("شدت مغناطیسی سیگنال لحظه‌ای (ADC)", color = GrayText, fontSize = 12.sp)
                Text("$adcValue", color = CyberGold, fontSize = 42.sp, fontWeight = FontWeight.Bold)

                Spacer(modifier = Modifier.height(8.dp))

                Text("اختلاف فاز متقابل (Phase Shift)", color = GrayText, fontSize = 12.sp)
                Text("$phaseShift°", color = CyberCyan, fontSize = 32.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}
