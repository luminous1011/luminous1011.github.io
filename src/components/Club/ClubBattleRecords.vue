<template>
  <div>
    <!-- Inline 模式：卡片渲染 -->
    <div v-if="inline" class="inline-wrapper">
      <div class="inline-header">
        <div class="inline-title">俱乐部盐场战绩</div>
        <div class="header-actions">
          <a-date-picker
            v-model:value="queryDate"
            @change="fetchBattleRecordsByDate"
            valueFormat="YYYY/MM/DD"
            :disabled-date="disabledDate"
          />
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button
            type="primary"
            size="small"
            :disabled="!battleRecords || loading"
            @click="handleExport"
          >
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            导出
          </n-button>
        </div>
      </div>

      <div class="battle-records-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div
          v-else-if="battleRecords && battleRecords.roleDetailsList"
          class="records-list"
        >
          <div class="records-info">
            <n-tag type="info">查询日期: {{ queryDate }}</n-tag>
            <n-tag type="success"
              >总成员: {{ battleRecords.roleDetailsList.length }}</n-tag
            >
          </div>

          <div
            v-for="member in battleRecords.roleDetailsList"
            :key="member.roleId"
            class="member-card"
          >
            <div class="member-header">
              <div class="member-info">
                <img
                  v-if="member.headImg"
                  :src="member.headImg"
                  :alt="member.name"
                  class="member-avatar"
                  @error="handleImageError"
                />
                <div v-else class="member-avatar-placeholder">
                  {{ member.name?.charAt(0) || "?" }}
                </div>
                <span class="member-name">{{ member.name }}</span>
              </div>
              <div class="member-stats-inline">
                <span class="stat-inline win"
                  >击杀 {{ member.winCnt || 0 }}</span
                >
                <span class="stat-inline loss"
                  >死亡 {{ member.loseCnt || 0 }}</span
                >
                <span class="stat-inline siege"
                  >攻城 {{ member.buildingCnt || 0 }}</span
                >
                <span class="stat-inline KD"
                  >K/D
                  {{
                    parseFloat(member.winCnt / member.loseCnt || 0).toFixed(2)
                  }}</span
                >
              </div>
              <n-button
                text
                size="small"
                class="details-button"
                @click="toggleMemberDetails(member.roleId)"
              >
                <template #icon>
                  <n-icon>
                    <ChevronDown v-if="!expandedMembers.has(member.roleId)" />
                    <ChevronUp v-else />
                  </n-icon>
                </template>
              </n-button>
            </div>

            <!-- 战斗详情（可展开） -->
            <n-collapse-transition :show="expandedMembers.has(member.roleId)">
              <div class="battle-details">
                <div
                  v-if="
                    member.targetRoleList && member.targetRoleList.length > 0
                  "
                  class="battles-list"
                >
                  <div
                    v-for="(battle, index) in member.targetRoleList"
                    :key="index"
                    class="battle-item"
                    :class="getBattleClass(battle)"
                  >
                    <div class="battle-participants">
                      <div class="participant attacker">
                        <img
                          v-if="battle.roleInfo?.headImg"
                          :src="battle.roleInfo.headImg"
                          :alt="battle.roleInfo.name"
                          class="participant-avatar"
                          @error="handleImageError"
                        />
                        <span class="participant-name">{{
                          battle.roleInfo?.name || "未知"
                        }}</span>
                      </div>
                      <div class="battle-vs">
                        <n-tag
                          :type="battle.attackType === 0 ? 'warning' : 'info'"
                          size="small"
                          >{{ parseAttackType(battle.attackType) }}</n-tag
                        >
                        <n-tag
                          :type="battle.newWinFlag === 2 ? 'success' : 'error'"
                          size="small"
                          >{{ parseBattleResult(battle.newWinFlag) }}</n-tag
                        >
                      </div>
                      <div class="participant defender">
                        <img
                          v-if="battle.targetRoleInfo?.headImg"
                          :src="battle.targetRoleInfo.headImg"
                          :alt="battle.targetRoleInfo.name"
                          class="participant-avatar"
                          @error="handleImageError"
                        />
                        <span class="participant-name">{{
                          battle.targetRoleInfo?.name || "未知"
                        }}</span>
                      </div>
                    </div>
                    <div class="battle-time">
                      {{ formatTimestamp(battle.timestamp) }}
                    </div>
                  </div>
                </div>
                <div v-else class="no-battles">
                  <n-empty description="暂无战斗记录" size="small" />
                </div>
              </div>
            </n-collapse-transition>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </div>

    <!-- Modal 模式 -->
    <n-modal
      v-else
      v-model:show="showModal"
      preset="card"
      title="俱乐部盐场战绩"
      style="width: 90%; max-width: 800px"
      @after-leave="handleClose"
    >
      <template #header-extra>
        <div class="header-actions">
          <a-date-picker
            v-model:value="queryDate"
            @change="fetchBattleRecordsByDate"
            valueFormat="YYYY/MM/DD"
            :disabled-date="disabledDate"
          />
          <n-button size="small" :disabled="loading" @click="handleRefresh">
            <template #icon>
              <n-icon>
                <Refresh />
              </n-icon>
            </template>
            刷新
          </n-button>
          <n-button
            type="primary"
            size="small"
            :disabled="!battleRecords || loading"
            @click="handleExport"
          >
            <template #icon>
              <n-icon>
                <Copy />
              </n-icon>
            </template>
            导出
          </n-button>
        </div>
      </template>

      <div class="battle-records-content">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <n-spin size="large">
            <template #description>正在加载战绩数据...</template>
          </n-spin>
        </div>

        <!-- 战绩列表 -->
        <div
          v-else-if="battleRecords && battleRecords.roleDetailsList"
          ref="exportDom"
          class="records-list"
        >
          <div class="records-info">
            <n-tag type="info">查询日期: {{ queryDate }}</n-tag>
            <n-tag type="success"
              >总成员: {{ battleRecords.roleDetailsList.length }}</n-tag
            >
          </div>

          <div
            v-for="member in battleRecords.roleDetailsList"
            :key="member.roleId"
            class="member-card"
          >
            <div class="member-header">
              <div class="member-info">
                <img
                  v-if="member.headImg"
                  :src="member.headImg"
                  :alt="member.name"
                  class="member-avatar"
                  @error="handleImageError"
                />
                <div v-else class="member-avatar-placeholder">
                  {{ member.name?.charAt(0) || "?" }}
                </div>
                <span class="member-name">{{ member.name }}</span>
              </div>
              <div class="member-stats-inline">
                <span class="stat-inline win"
                  >击杀 {{ member.winCnt || 0 }}</span
                >
                <span class="stat-inline loss"
                  >死亡 {{ member.loseCnt || 0 }}</span
                >
                <span class="stat-inline siege"
                  >攻城 {{ member.buildingCnt || 0 }}</span
                >
                <span class="stat-inline KD"
                  >K/D
                  {{
                    parseFloat(member.winCnt / member.loseCnt || 0).toFixed(2)
                  }}</span
                >
              </div>
              <n-button
                text
                size="small"
                class="details-button"
                @click="toggleMemberDetails(member.roleId)"
              >
                <template #icon>
                  <n-icon>
                    <ChevronDown v-if="!expandedMembers.has(member.roleId)" />
                    <ChevronUp v-else />
                  </n-icon>
                </template>
              </n-button>
            </div>

            <!-- 战斗详情（可展开） -->
            <n-collapse-transition :show="expandedMembers.has(member.roleId)">
              <div class="battle-details">
                <div
                  v-if="
                    member.targetRoleList && member.targetRoleList.length > 0
                  "
                  class="battles-list"
                >
                  <div
                    v-for="(battle, index) in member.targetRoleList"
                    :key="index"
                    class="battle-item"
                    :class="getBattleClass(battle)"
                  >
                    <div class="battle-participants">
                      <div class="participant attacker">
                        <img
                          v-if="battle.roleInfo?.headImg"
                          :src="battle.roleInfo.headImg"
                          :alt="battle.roleInfo.name"
                          class="participant-avatar"
                          @error="handleImageError"
                        />
                        <span class="participant-name">{{
                          battle.roleInfo?.name || "未知"
                        }}</span>
                      </div>
                      <div class="battle-vs">
                        <n-tag
                          :type="battle.attackType === 0 ? 'warning' : 'info'"
                          size="small"
                          >{{ parseAttackType(battle.attackType) }}</n-tag
                        >
                        <n-tag
                          :type="battle.newWinFlag === 2 ? 'success' : 'error'"
                          size="small"
                          >{{ parseBattleResult(battle.newWinFlag) }}</n-tag
                        >
                      </div>
                      <div class="participant defender">
                        <img
                          v-if="battle.targetRoleInfo?.headImg"
                          :src="battle.targetRoleInfo.headImg"
                          :alt="battle.targetRoleInfo.name"
                          class="participant-avatar"
                          @error="handleImageError"
                        />
                        <span class="participant-name">{{
                          battle.targetRoleInfo?.name || "未知"
                        }}</span>
                      </div>
                    </div>
                    <div class="battle-time">
                      {{ formatTimestamp(battle.timestamp) }}
                    </div>
                  </div>
                </div>
                <div v-else class="no-battles">
                  <n-empty description="暂无战斗记录" size="small" />
                </div>
              </div>
            </n-collapse-transition>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <n-empty description="暂无战绩数据" size="large">
            <template #icon>
              <n-icon>
                <DocumentText />
              </n-icon>
            </template>
          </n-empty>
        </div>
      </div>
    </n-modal>

    <!-- <n-modal v-model:show="modalVisible"  style="transform: scale(0.5);"> -->
    <div ref="exportDom" style="width: 880px">
      <header class="header">
        {{ club.name }}
        <span style="margin-right: 5px; margin-left: 5px">|</span> 盐场战报 |
        战报日期:{{ queryDate }}
      </header>
      <header class="subtitle">数据更新时间: {{ getCurrentDateTime() }}</header>
      <main class="modal-wrapper">
        <section>
          <n-table :single-line="false" style="width: 630px">
            <thead>
              <tr>
                <th>序号</th>
                <th style="text-align: left">名称</th>
                <th>击杀</th>
                <th>死亡</th>
                <th>平局</th>
                <th>总战斗</th>
                <th>胜率</th>
                <th>刨地</th>
                <th>用丹</th>
                <th>KD比</th>
              </tr>
            </thead>
            <tbody
              v-show="battleRecords && battleRecords.roleDetailsList.length"
            >
              <tr
                v-for="item in battleRecords.roleDetailsList"
                :key="item.roleId"
                style="height: 24px"
              >
                <td style="width: 30px">{{ item.index }}</td>

                <!-- 名称 -->
                <td
                  style="
                    width: 160px;
                    font-weight: 600;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    width: 100%;
                    color: #252525;
                  "
                >
                  <img
                    v-if="item.headImg"
                    :src="item.headImg"
                    :alt="item.name"
                    class="club-avatar"
                  />
                  {{ item.name }}
                </td>

                <!-- 击杀 -->
                <td style="width: 60px; background: #ecfdf2; color: #8cc269">
                  <n-progress
                    type="line"
                    color="#8cc269"
                    unit=""
                    :percentage="((item.winCnt / topWinCnt) * 100).toFixed()"
                  >
                    {{ item.winCnt || 0 }}
                  </n-progress>
                </td>

                <!-- 死亡 -->
                <td style="width: 60px; background: #fef0f0; color: #e07679">
                  <n-progress
                    type="line"
                    color="#e07679"
                    unit=""
                    :percentage="((item.loseCnt / topLoseCnt) * 100).toFixed()"
                  >
                    {{ item.loseCnt || 0 }}
                  </n-progress>
                </td>

                <!-- 平局 -->
                <td
                  style="width: 50px"
                  v-show="item.targetRoleList?.length !== 0"
                >
                  {{
                    item.targetRoleList?.length !== 0 &&
                    item.winCnt !== 0 &&
                    item.loseCnt !== 0
                      ? item.targetRoleList?.length - item.winCnt - item.loseCnt
                      : 0
                  }}
                </td>

                <!-- 总战斗 -->
                <td
                  style="width: 50px"
                  v-show="item.targetRoleList?.length !== 0"
                >
                  {{ item.targetRoleList?.length || 0 }}
                </td>

                <!-- 胜率 -->
                <td
                  style="width: 50px; color: #00bfff"
                  v-show="item.targetRoleList?.length !== 0"
                >
                  {{
                    item.winCnt !== 0 && item.targetRoleList?.length !== 0
                      ? (
                          (item.winCnt / item.targetRoleList?.length) *
                          100
                        ).toFixed() + "%"
                      : "-"
                  }}
                </td>

                <!-- 刨地 -->
                <td style="width: 60px; color: #76b5f4">
                  <n-progress
                    type="line"
                    color="#e46b6f"
                    unit=""
                    :percentage="
                      ((item.buildingCnt / topBuildingCnt) * 100).toFixed()
                    "
                  >
                    {{ item.buildingCnt || 0 }}
                  </n-progress>
                </td>

                <!-- 用丹 -->
                <td style="width: 60px; color: #de9960">
                  <n-progress
                    type="line"
                    color="#de9960"
                    unit=""
                    :percentage="
                      (
                        ((item.loseCnt > 6 ? item.loseCnt - 6 : 0) /
                          topDanCnt) *
                        100
                      ).toFixed()
                    "
                  >
                    {{ item.loseCnt > 6 ? item.loseCnt - 6 : 0 }}
                  </n-progress>
                </td>

                <!-- KD比 -->
                <td
                  style="width: 50px; font-weight: 600"
                  :style="
                    (item.winCnt / item.loseCnt).toFixed(2) > 1
                      ? 'color: #5b8f64;background: #ecfdf2;'
                      : item.winCnt === item.loseCnt
                      ? ''
                      : 'color:#d7000f;background: #fef0f0;'
                  "
                >
                  {{
                    item.winCnt !== 0 || item.loseCnt !== 0
                      ? (item.winCnt / item.loseCnt).toFixed(2)
                      : "-"
                  }}
                </td>
              </tr>
            </tbody>
          </n-table>
        </section>
        <section>
          <!-- 击杀前三 -->
          <div class="top-wrapper">
            <div class="top-title">击杀前三</div>
            <div
              class="top-item"
              v-for="item in JSON.parse(stringData).slice(0, 3)"
              :key="item.roleId"
            >
              <div style="display: flex; align-items: center">
                <img
                  v-if="item.headImg"
                  :src="item.headImg"
                  :alt="item.name"
                  class="club-avatar"
                />

                {{ item.name }}
              </div>
              <div style="color: #8cc269; font-size: 14px">
                {{ item.winCnt || 0 }}
              </div>
            </div>
          </div>

          <!-- 刨地前三 -->
          <div class="top-wrapper">
            <div class="top-title" style="border-color: #e46b6f">刨地前三</div>
            <div
              class="top-item error"
              v-for="item in JSON.parse(stringData)
                .sort((a, b) => b.buildingCnt - a.buildingCnt)
                .slice(0, 3)"
              :key="item.roleId"
            >
              <div style="display: flex; align-items: center">
                <img
                  v-if="item.headImg"
                  :src="item.headImg"
                  :alt="item.name"
                  class="club-avatar"
                />

                {{ item.name }}
              </div>
              <div style="color: #76b5f4; font-size: 14px">
                {{ item.buildingCnt || 0 }}
              </div>
            </div>
          </div>

          <!-- 用丹前三 -->
          <div class="top-wrapper">
            <div class="top-title" style="border-color: #de9960">用丹前三</div>
            <div
              class="top-item warning"
              v-for="item in JSON.parse(stringData)
                .sort((a, b) => b.loseCnt - a.loseCnt)
                .slice(0, 3)"
              :key="item.roleId"
            >
              <div style="display: flex; align-items: center">
                <img
                  v-if="item.headImg"
                  :src="item.headImg"
                  :alt="item.name"
                  class="club-avatar"
                />

                {{ item.name }}
              </div>
              <div style="color: #de9960; font-size: 14px">
                {{ item.loseCnt > 6 ? item.loseCnt - 6 : 0 }}
              </div>
            </div>
          </div>

          <!-- 死亡前三 -->
          <div class="top-wrapper">
            <div class="top-title" style="border-color: #e46b6f">死亡前三</div>
            <div
              class="top-item error"
              v-for="item in JSON.parse(stringData)
                .sort((a, b) => b.loseCnt - a.loseCnt)
                .slice(0, 3)"
              :key="item.roleId"
            >
              <div style="display: flex; align-items: center">
                <img
                  v-if="item.headImg"
                  :src="item.headImg"
                  :alt="item.name"
                  class="club-avatar"
                />

                {{ item.name }}
              </div>
              <div style="color: #d7000f; font-size: 14px">
                {{ item.loseCnt || 0 }}
              </div>
            </div>
          </div>

          <!-- KD前三 -->
          <div class="top-wrapper">
            <div class="top-title" style="border-color: #8cc269">KD前三</div>

            <div
              class="top-item successs"
              v-for="item in JSON.parse(stringData)
                .sort(
                  (a, b) =>
                    (b.winCnt || 0) / (b.loseCnt || 0) -
                    (a.winCnt || 0) / (a.loseCnt || 0)
                )
                .slice(0, 3)"
              :key="item.roleId"
            >
              <div style="display: flex; align-items: center">
                <img
                  v-if="item.headImg"
                  :src="item.headImg"
                  :alt="item.name"
                  class="club-avatar"
                />

                {{ item.name }}
              </div>
              <div style="color: #5b8f64; font-size: 14px">
                {{ (item.winCnt / item.loseCnt).toFixed(2) }}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
    <!-- </n-modal> -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import html2canvas from "html2canvas";
import {
  Trophy,
  Refresh,
  Copy,
  ChevronDown,
  ChevronUp,
  DocumentText,
} from "@vicons/ionicons5";
import {
  getLastSaturday,
  formatTimestamp,
  parseBattleResult,
  parseAttackType,
  formatBattleRecordsForExport,
  copyToClipboard,
} from "@/utils/clubBattleUtils";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  inline: {
    type: Boolean,
    default: false,
  },
});

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

const modalVisible = ref(true);
const topWinCnt = ref(0);
const stringData = ref("[]");
const topLoseCnt = ref(0);
const topDanCnt = ref(0);
const topBuildingCnt = ref(0);
const exportDom = ref(null);
const emit = defineEmits(["update:visible"]);

const message = useMessage();
const tokenStore = useTokenStore();

const info = computed(() => tokenStore.gameData?.legionInfo || null);
const club = computed(() => info.value?.info || null);

const showModal = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const loading = ref(false);
const battleRecords = ref({
  roleDetailsList: [],
});
const expandedMembers = ref(new Set());
const queryDate = ref("");

const legionMatch = ref({
  isRegistered: false,
});

// 格式化战力
const formatPower = (power) => {
  if (!power) return "0";
  if (power >= 100000000) {
    return (power / 100000000).toFixed(2) + "亿";
  }
  if (power >= 10000) {
    return (power / 10000).toFixed(2) + "万";
  }
  return power.toString();
};

function getFourthSunday(year, month) {
    // 创建一个指定月份的第一天
    let date = new Date(year, month - 1, 1); // 月份是从0开始的，所以减1
    let day = date.getDay(); // 获取这个月的第一天是周几（0=周日，1=周一，...，6=周六）
    
    // 计算这个月第一个周日是几号
    let firstSunday = (day >= 1) ? (8 - day) : 1; // 如果第一天不是周日或周一，则第一个周日是这个月的第一天之后的8-day天
    
    // 计算第四个周日是几号
    let fourthSunday = firstSunday + 7 * 3; // 从第一个周日开始算起，第三个星期后的一天就是第四个周日
    
    // 返回第四个周日的日期
    return new Date(year, month - 1, fourthSunday);
}


// 获取战斗样式类
const getBattleClass = (battle) => {
  const classes = [];
  if (battle.newWinFlag === 2) {
    classes.push("battle-win");
  } else {
    classes.push("battle-loss");
  }
  if (battle.attackType === 0) {
    classes.push("battle-attack");
  } else {
    classes.push("battle-defend");
  }
  return classes.join(" ");
};

// 切换成员详情展开状态
const toggleMemberDetails = (roleId) => {
  if (expandedMembers.value.has(roleId)) {
    expandedMembers.value.delete(roleId);
  } else {
    expandedMembers.value.add(roleId);
  }
};

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.style.display = "none";
};
const disabledDate = (current) => {
  return current.getDay() != 6 || current > Date.now()  ; 
};

//日期选择时调用查询战绩方法
const fetchBattleRecordsByDate = (val) => {
  if (undefined != val) {
    queryDate.value = val;
  } else {
    queryDate.value = getLastSaturday();
  }
  fetchBattleRecords();
};

// 查询战绩
const fetchBattleRecords = async () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择游戏角色");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;

  // 检查WebSocket连接
  const wsStatus = tokenStore.getWebSocketStatus(tokenId);
  if (wsStatus !== "connected") {
    message.error("WebSocket未连接，无法查询战绩");
    return;
  }

  loading.value = true;

  try {
    const result = await tokenStore.sendMessageWithPromise(
      tokenId,
      "legionwar_getdetails",
      { date: queryDate.value },
      10000
    );

    if (result && result.roleDetailsList) {
      result.roleDetailsList.sort((a, b) => {
        if (b.winCnt !== a.winCnt) {
          return b.winCnt - a.winCnt;
        }
        if (a.loseCnt !== b.loseCnt) {
          return a.loseCnt - b.loseCnt;
        }
      });

      result.roleDetailsList.forEach((item, index) => {
        item.index = index + 1;
      });

      stringData.value = JSON.stringify(result.roleDetailsList);
      topWinCnt.value = result.roleDetailsList[0].winCnt; // 击杀最多
      topLoseCnt.value = JSON.parse(stringData.value).sort(
        // 死亡最多
        (a, b) => b.loseCnt - a.loseCnt
      )[0].loseCnt;

      topBuildingCnt.value = JSON.parse(stringData.value).sort(
        // 刨地最多
        (a, b) => b.buildingCnt - a.buildingCnt
      )[0].buildingCnt;

      topDanCnt.value = topLoseCnt.value > 6 ? topLoseCnt.value - 6 : 100; // 用丹最多

      battleRecords.value = result;
      message.success("战绩加载成功");
    } else {
      battleRecords.value = null;
      message.warning("未查询到战绩数据");
    }
  } catch (error) {
    console.error("查询战绩失败:", error);
    message.error(`查询失败: ${error.message}`);
    battleRecords.value = null;
  } finally {
    loading.value = false;
  }
};

// 刷新战绩
const handleRefresh = () => {
  fetchBattleRecords();
};

// 导出战绩
const handleExport = async () => {
  if (!battleRecords.value || !battleRecords.value.roleDetailsList) {
    message.warning("没有可导出的数据");
    return;
  }

  try {
    //导出成excel
    // const exportText = formatBattleRecordsForExport(
    //   battleRecords.value.roleDetailsList,
    //   queryDate.value
    // )
    // await copyToClipboard(exportText)
    //导出成图片,两种方式自选一吧
    exportToImage();
    message.success("战绩已复制到剪贴板");
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败，请重试");
  }
};

const exportToImage = async () => {
  // 校验：确保DOM已正确绑定
  if (!exportDom.value) {
    alert("未找到要导出的DOM元素");
    return;
  }

  try {
    // 5. 用html2canvas渲染DOM为Canvas
    console.error(exportDom.value);
    const canvas = await html2canvas(exportDom.value, {
      scale: 2, // 放大2倍，解决图片模糊问题
      useCORS: true, // 允许跨域图片（若DOM内有远程图片，需开启）
      backgroundColor: "#ffffff", // 避免透明背景（默认透明）
      logging: false, // 关闭控制台日志
    });

    // 6. Canvas转图片链接（支持PNG/JPG）
    const imgUrl = canvas.toDataURL("image/png"); // 若要JPG，改为'image/jpeg'

    // 7. 创建下载链接，触发浏览器下载
    const link = document.createElement("a");
    link.href = imgUrl;
    console.log();
    link.download =
      queryDate.value.replace("/", "月").replace("/", "日") + "盐场战报.png"; // 下载文件名
    document.body.appendChild(link);
    link.click(); // 触发点击下载
    document.body.removeChild(link); // 下载后清理DOM
  } catch (err) {
    console.error("DOM转图片失败：", err);
    alert("导出图片失败，请重试");
  }
};

// 关闭弹窗
const handleClose = () => {
  expandedMembers.value.clear();
};

// 暴露方法给父组件
defineExpose({
  fetchBattleRecords,
});

// Inline 模式：挂载后自动拉取
onMounted(() => {
  if (props.inline) {
    // queryDate.value = getLastSaturday();
    queryDate.value = '2025/12/28';

    fetchBattleRecords();
  }
});
</script>

<style>
.n-card__content {
  padding: 5px 16px !important;
  /* background: #eee !important;  */
}
.n-progress-graph-line-rail {
  height: 6px !important;
}
.n-progress.n-progress--line .n-progress-custom-content {
  margin-left: 3px !important;
}
</style>
<style scoped lang="scss">
.modal-wrapper {
  display: flex;
  font-weight: 600 !important;
  font-size: 12px;
  & > section:first-child {
    margin-right: 16px;
  }
  .top-wrapper {
    width: 200px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    padding: 12px;
    background: #fff;
    border: 1px solid rgba(239, 239, 245, 1);
    border-radius: 4px;
    margin-bottom: 12px;
  }
  .top-title {
    border-bottom: 2px solid #8cc269;
    padding: 5px 0;
    font-size: 14px;
    //  <td style="width: 60px; background: #effcef;>
  }
  .top-item {
    padding: 5px 12px 0 5px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #ecfdf4;
    margin-top: 4px;
    &.error {
      background: #fff0f0;
    }
    &.warning {
      background: #fff5ea;
    }
    &.success {
      background: #ecfdf4;
    }
    &:nth-child(3) {
      background: #fbf8fc;
    }
    &:nth-child(4) {
      background: #f7fbf9;
    }
  }
}

.header {
  // width: 630px;
  text-align: center;
  height: 24px;
  margin: 0 !important;
}
.subtitle {
  // width: 630px;
  font-size: 10px;
  text-align: center;
  color: #3a3a3a;
}
.club-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
  color: #252525;
}
.n-table {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08) !important;
}
.n-table td {
  padding: 5px;
  text-align: center;
  // display: flex;
  font-size: 12px !important;
  color: #111;
  font-weight: 600;
}
th {
  font-size: 12px !important;
  padding: 5px;
  text-align: center;
  color: #111;
}
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-sm);
  font-weight: bold;
}
.inline-wrapper {
  background: var(--bg-primary);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--border-light);
  padding: var(--spacing-md);
}

.inline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.inline-title {
  font-weight: var(--font-weight-semibold);
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.battle-records-content {
  min-height: 400px;
  max-height: 400px;
  overflow-y: auto;
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.records-info {
  display: flex;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.member-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-sm);
  transition: all var(--transition-fast);

  &:hover {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }

  & + & {
    margin-top: var(--spacing-sm);
  }
}

.member-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.member-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 120px;
  max-width: 120px;
  flex-shrink: 0;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.member-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
}

.member-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  min-width: 0;
}

.member-stats-inline {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
  flex: 1;
}

.details-button {
  flex-shrink: 0;
  margin-left: auto;
}

.stat-inline {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  border-radius: var(--border-radius-small);
  white-space: nowrap;
  min-width: 52px;
  text-align: center;

  &.win {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
  }

  &.loss {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  &.siege {
    background: rgba(245, 158, 11, 0.1);
    color: #d97706;
  }

  &.KD {
    background: rgba(151, 151, 151, 0.1);
    color: #858585;
  }
}

.battle-details {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
}

.battles-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-height: 400px;
  overflow-y: auto;
}

.battle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border-radius: var(--border-radius-medium);
  border-left: 3px solid transparent;

  &.battle-win {
    border-left-color: #10b981;
  }

  &.battle-loss {
    border-left-color: #ef4444;
  }
}

.battle-participants {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  flex: 1;
}

.participant {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.participant-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.participant-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.battle-vs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.battle-time {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
}

.no-battles {
  padding: var(--spacing-xl);
  text-align: center;
}

// 响应式设计
@media (max-width: 768px) {
  .member-stats {
    grid-template-columns: 1fr;
  }

  .battle-participants {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .battle-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .battle-time {
    align-self: flex-end;
  }
}
</style>
