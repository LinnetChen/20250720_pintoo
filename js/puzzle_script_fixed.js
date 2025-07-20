
// ✅ 動態插入動畫樣式
const style = document.createElement('style');
style.textContent = `
@keyframes rotate3DTwice {
  0% {
    transform: translate(-50%, -50%) rotateY(0deg);
  }
  50% {
    transform: translate(-50%, -50%) rotateY(180deg);
  }
  100% {
    transform: translate(-50%, -50%) rotateY(360deg);
  }
}
.puzzle-complete-animation {
  animation: rotate3DTwice 2s ease-in-out;
  transform-style: preserve-3d;
  backface-visibility: hidden;
}`;
document.head.appendChild(style);

// ✅ 原 gameComplete 邏輯移至 animate 的 switch-case
function animate(state, puzzle, tmpImage) {
  switch (state) {
    case 60:
      // 將圖片直接設為畫面中央
      tmpImage.style.left = "50%";
      tmpImage.style.top = "50%";
      tmpImage.style.transform = "translate(-50%, -50%)";
      tmpImage.style.position = 'absolute';
      tmpImage.style.width = '300px';
      tmpImage.style.height = '400px';
      tmpImage.style.borderRadius = '15px';
      tmpImage.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
      tmpImage.style.border = '3px solid #4CAF50';
      tmpImage.style.zIndex = '2000';

      puzzle.container.appendChild(tmpImage);

      // 啟動動畫
      setTimeout(() => {
        tmpImage.classList.add("puzzle-complete-animation");
      }, 100);

      // 加入煙火特效（假設 createFireworks 函式存在）
      setTimeout(() => {
        createFireworks();
      }, 1000);

      break;

    // 其他 state 處理維持原樣
    default:
      break;
  }
}
