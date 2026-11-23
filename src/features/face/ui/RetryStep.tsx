import { ISSUE_MESSAGES } from '../content/messages';
import type { IssueCode, Quality } from '../types';
import DevPanel from './DevPanel';
import Photo from './Photo';

// 사진이 검사를 통과하지 못했을 때: 이유 안내 + 다시 시도
type Props = {
  image: HTMLCanvasElement | null;
  issues: IssueCode[];
  quality?: Quality;
  onRetry: () => void;
  onCamera: () => void;
};

export default function RetryStep({ image, issues, quality, onRetry, onCamera }: Props) {
  return (
    <section className="face-step face-retry">
      {image && (
        <div className="face-frame is-dimmed">
          <Photo image={image} />
        </div>
      )}

      <h2 className="face-headline">이 사진으로는 읽기 어려워요</h2>
      <ul className="face-issues">
        {issues.map((code) => (
          <li key={code}>{ISSUE_MESSAGES[code].title}</li>
        ))}
      </ul>

      <div className="face-actions">
        <button className="btn" onClick={onRetry}>다른 사진 올리기</button>
        <button className="face-btn-ghost" onClick={onCamera}>카메라로 촬영하기</button>
      </div>

      {quality && <DevPanel data={quality} />}
    </section>
  );
}
