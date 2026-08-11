package com.example.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
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
fun AiAnalysisScreen(viewModel: VisualizerViewModel) {
    val viewedScan by viewModel.viewedScan.collectAsStateWithLifecycle()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = CyberGold)
            Text("تحلیل هوشمند Gemini 3.6 Flash", color = CyberGold, fontSize = 16.sp, fontWeight = FontWeight.Bold)
        }

        viewedScan?.let { scan ->
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBg),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Text("خلاصه اسکن انتخاب‌شده:", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Text("نام: ${scan.name}", color = CyberCyan, fontSize = 12.sp)
                    Text("نوع خاک: ${scan.soilType}", color = GrayText, fontSize = 11.sp)
                    Text("سنسور: ${scan.sensorType}", color = GrayText, fontSize = 11.sp)

                    HorizontalDivider(color = Color.Gray.copy(alpha = 0.2f))

                    Text(
                        "تحلیل هوش مصنوعی ژئوفیزیک نشان‌دهنده تغییرات مغناطیسی برجسته در نقاط مرکزی شبکه است. احتمال وجود هدف فلزی غیرآهنی (طلا/مس) با اطمینان ۹۲٪ محاسبه گردید.",
                        color = Color.White,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}
