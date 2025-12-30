import { gameLogger } from "@/utils/logger";
import type { EVM, Session } from ".";
import { findAnswer } from "@/utils/studyQuestionsFromJSON";
import { isInCurrentWeek } from "@/utils/base";

export const ClockPlugin = ({
  onSome,
  $emit
}: EVM) => {
  onSome(['system_claimhangupreward', 'system_claimhanguprewardresp'], async (data: Session) => {
    console.log(`收到加钟/时钟信息事件: ${data.tokenId}`, data);
    const { client } = data;
    setTimeout(() => {
      client?.send('role_getroleinfo', {})
    }, 800)
  });

  onSome(['syncresp', 'system_mysharecallback'], async (data: Session) => {
    console.log(`收到加钟/时钟信息事件: ${data.tokenId}`, data);
    const { client } = data;
    setTimeout(() => {
      client?.send('role_getroleinfo', {})
    }, 800)
  });

}