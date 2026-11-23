import type { IssueCode } from '../types';

// 사진 검사에 걸렸을 때 보여줄 안내 문구
// title: 다시 찍기 화면용 / live: 실시간 카메라 화면의 짧은 안내
export const ISSUE_MESSAGES: Record<IssueCode, { title: string; live: string }> = {
  FILE_TYPE: { title: 'JPG, PNG, WEBP 사진만 올릴 수 있어요.', live: '' },
  FILE_TOO_BIG: { title: '사진 용량이 너무 커요. 15MB 이하로 올려주세요.', live: '' },
  FILE_BROKEN: { title: '사진을 열 수 없어요. 다른 사진으로 시도해 주세요.', live: '' },
  IMAGE_TOO_SMALL: { title: '사진 해상도가 너무 낮아요. 더 큰 사진을 올려주세요.', live: '' },
  NO_FACE: {
    title: '사람 얼굴을 찾지 못했어요. 그림·캐릭터가 아닌 실제 얼굴이 또렷한 사진을 올려주세요.',
    live: '얼굴을 가이드 안에 맞춰주세요',
  },
  MULTIPLE_FACES: { title: '여러 명이 보여요. 한 사람만 나온 사진을 올려주세요.', live: '한 사람만 화면에 나와주세요' },
  FACE_TOO_SMALL: { title: '얼굴이 너무 작아요. 얼굴이 크게 나온 사진을 올려주세요.', live: '조금 더 가까이 와주세요' },
  FACE_TOO_CLOSE: { title: '얼굴이 너무 가까워요.', live: '조금만 뒤로 물러나 주세요' },
  FACE_OFF_CENTER: { title: '얼굴이 가운데에서 벗어났어요.', live: '얼굴을 가운데로 옮겨주세요' },
  FACE_CUT_OFF: { title: '얼굴이 사진 밖으로 잘렸어요. 얼굴 전체가 나오게 해주세요.', live: '얼굴 전체가 보이게 해주세요' },
  HEAD_TURNED: { title: '얼굴이 옆을 보고 있어요. 정면 사진을 올려주세요.', live: '정면을 바라봐 주세요' },
  HEAD_PITCHED: { title: '고개를 숙이거나 들었어요. 카메라를 똑바로 본 사진을 올려주세요.', live: '턱을 수평으로 맞춰주세요' },
  HEAD_TILTED: { title: '고개가 기울어져 있어요. 똑바로 세운 사진을 올려주세요.', live: '고개를 똑바로 세워주세요' },
  SMILING: { title: '활짝 웃고 있어요. 무표정에 가까운 사진이 정확해요.', live: '편안한 무표정을 지어주세요' },
  MOUTH_OPEN: { title: '입이 벌어져 있어요. 입을 다문 사진을 올려주세요.', live: '입을 다물어 주세요' },
  EYES_CLOSED: { title: '눈을 감고 있어요. 눈을 뜬 사진을 올려주세요.', live: '눈을 떠주세요' },
  TOO_DARK: { title: '사진이 너무 어두워요. 밝은 곳에서 찍은 사진을 올려주세요.', live: '더 밝은 곳으로 옮겨주세요' },
  TOO_BRIGHT: { title: '빛이 너무 강해요. 빛이 부드러운 곳에서 찍어주세요.', live: '빛이 너무 강해요' },
  BLURRY: { title: '사진이 흐려요. 흔들리지 않은 선명한 사진을 올려주세요.', live: '' },
  EYES_COVERED: { title: '눈이 가려진 것 같아요. 선글라스나 앞머리를 치워주세요.', live: '눈이 보이게 해주세요' },
  MASK: { title: '마스크로 얼굴이 가려진 것 같아요. 마스크를 벗고 찍어주세요.', live: '마스크를 벗어주세요' },
  MODEL_LOAD_FAILED: { title: '분석 도구를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.', live: '분석 도구를 불러오지 못했어요' },
};
