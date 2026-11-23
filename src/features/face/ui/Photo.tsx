import { useEffect, useRef } from 'react';

// 분석용 캔버스를 화면에 그대로 보여주는 컴포넌트 (틀을 꽉 채움)
export default function Photo({ image }: { image: HTMLCanvasElement }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.getContext('2d')!.drawImage(image, 0, 0);
  }, [image]);

  return <canvas ref={ref} className="face-photo" />;
}
