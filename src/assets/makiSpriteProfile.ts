import legacyIdleUrl from '/assets/maki_idle_generated_v2_despill.png';
import legacyPinchIdleUrl from '/assets/maki_pinch_idle_generated_despill.png';
import legacyWalkUrl from '/assets/maki_walk_hairsway_stabilized_despill.png';
import legacyAttackUrl from '/assets/maki_attack_generated_despill_hairfix.png';
import legacyKickUrl from '/assets/maki_kick_generated_despill.png';
import legacyJumpUrl from '/assets/maki_jump_generated_despill.png';
import legacyHurtUrl from '/assets/maki_hurt_generated_despill.png';
import legacyGrabbedUrl from '/assets/maki_hagai_victim_generated_fit.png';
import legacyDeathUrl from '/assets/maki_death_generated_despill.png';
import legacyDownUrl from '/assets/maki_down_generated_despill.png';
import legacyDownHitUrl from '/assets/maki_downhit_generated_despill.png';
import legacyMountPunchUrl from '/assets/maki_mount_punch_generated_despill.png';
import legacyGetupUrl from '/assets/maki_getup_generated_despill.png';

import newIdleUrl from '/assets/maki_20260622_idle.png';
import newWalkUrl from '/assets/maki_20260622_walk.png';
import newAttackUrl from '/assets/maki_20260622_attack.png';
import newKickUrl from '/assets/maki_20260622_kick.png';
import newJumpUrl from '/assets/maki_20260622_jump.png';
import newHurtUrl from '/assets/maki_20260622_hurt.png';
import newDownUrl from '/assets/maki_20260622_down.png';
import newDownHitUrl from '/assets/maki_20260622_downhit.png';
import newGetupUrl from '/assets/maki_20260622_getup.png';
import newPinnedVictimUrl from '/assets/maki_20260622_pinned_victim.png';
import newChokeHoldUrl from '/assets/maki_20260622_choke_hold.png';
import newHagaiVictimUrl from '/assets/maki_20260622_hagai_victim.png';
import newLaunchUrl from '/assets/maki_20260622_launch.png';

export type MakiSpriteProfile = {
  label: string;
  urls: {
    idle: string;
    pinchIdle: string;
    walk: string;
    attack: string;
    kick: string;
    jump: string;
    hurt: string;
    grabbed: string;
    bound: string;
    death: string;
    down: string;
    downHit: string;
    launch: string;
    mountPunch: string;
    reverseCrab: string;
    getup: string;
  };
  animation: {
    walkFrames: number;
    hurtFrames: number;
    getupFrames: number;
    kickFrameWidth: number;
    downSourceWidth: number;
    downHitSourceWidth: number;
    mountPunchSourceWidth: number;
  };
};

export const legacyMakiSpriteProfile: MakiSpriteProfile = {
  label: 'legacy',
  urls: {
    idle: legacyIdleUrl,
    pinchIdle: legacyPinchIdleUrl,
    walk: legacyWalkUrl,
    attack: legacyAttackUrl,
    kick: legacyKickUrl,
    jump: legacyJumpUrl,
    hurt: legacyHurtUrl,
    grabbed: legacyGrabbedUrl,
    bound: legacyGrabbedUrl,
    death: legacyDeathUrl,
    down: legacyDownUrl,
    downHit: legacyDownHitUrl,
    launch: legacyDownHitUrl,
    mountPunch: legacyMountPunchUrl,
    reverseCrab: legacyDownUrl,
    getup: legacyGetupUrl,
  },
  animation: {
    walkFrames: 4,
    hurtFrames: 2,
    getupFrames: 2,
    kickFrameWidth: 220,
    downSourceWidth: 320,
    downHitSourceWidth: 320,
    mountPunchSourceWidth: 320,
  },
};

export const maki20260622SpriteProfile: MakiSpriteProfile = {
  label: '20260622',
  urls: {
    idle: newIdleUrl,
    pinchIdle: newIdleUrl,
    walk: newWalkUrl,
    attack: newAttackUrl,
    kick: newKickUrl,
    jump: newJumpUrl,
    hurt: newHurtUrl,
    grabbed: newChokeHoldUrl,
    bound: newHagaiVictimUrl,
    death: newHurtUrl,
    down: newDownUrl,
    downHit: newDownHitUrl,
    launch: newLaunchUrl,
    mountPunch: newPinnedVictimUrl,
    reverseCrab: newPinnedVictimUrl,
    getup: newGetupUrl,
  },
  animation: {
    walkFrames: 2,
    hurtFrames: 4,
    getupFrames: 2,
    kickFrameWidth: 240,
    downSourceWidth: 240,
    downHitSourceWidth: 240,
    mountPunchSourceWidth: 240,
  },
};

export const activeMakiSpriteProfile = maki20260622SpriteProfile;
