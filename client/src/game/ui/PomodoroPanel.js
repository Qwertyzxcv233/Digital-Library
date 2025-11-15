export default class PomodoroPanel {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.isMinimized = false;
    this.isRunning = false;
    this.isOnBreak = false;
    this.intervalId = null;

    // durations in seconds
    this.workDuration = 25 * 60; // 25 minutes
    this.breakDuration = 5 * 60; // 5 minutes
    this.remaining = this.workDuration;

    this.createDOM();
  }

  createDOM() {
    // Add global styles (matching inventory UI style)
    const style = document.createElement('style');
    style.textContent = `
      /* Corner button (like inventory) */
      #pomodoro-btn-corner {
        position: fixed;
        right: 72px;
        bottom: 16px;
        background: #1a1410;
        border: 2px solid #8b6f47;
        box-shadow: 
          inset -2px -2px 0 rgba(0, 0, 0, 0.5),
          3px 3px 0 rgba(0, 0, 0, 0.4);
        color: #f4e8d0;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        cursor: pointer;
        border-radius: 0;
        font-family: monospace;
        z-index: 500;
        transition: transform 0.1s;
      }
      
      #pomodoro-btn-corner:hover {
        transform: translate(-1px, -1px);
        box-shadow: 
          inset -2px -2px 0 rgba(0, 0, 0, 0.5),
          4px 4px 0 rgba(0, 0, 0, 0.5);
      }
      
      #pomodoro-btn-corner:active {
        transform: translate(1px, 1px);
        box-shadow: 
          inset -2px -2px 0 rgba(0, 0, 0, 0.5),
          2px 2px 0 rgba(0, 0, 0, 0.3);
      }
      
      /* Fullscreen panel */
      #pomodoro-panel {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(12, 12, 12, 0.98);
        display: none;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9998;
      }
      
      #pomodoro-panel.visible {
        display: flex;
      }
      
      .pomodoro-content {
        text-align: center;
        color: #f4e8d0;
        font-family: 'Press Start 2P', monospace;
      }
      
      .pomodoro-title {
        font-size: 32px;
        margin-bottom: 40px;
      }
      
      .pomodoro-timer-big {
        font-size: 120px;
        margin-bottom: 40px;
        font-weight: bold;
        letter-spacing: 8px;
      }
      
      .pomodoro-status {
        font-size: 24px;
        margin-bottom: 50px;
      }
      
      .pomodoro-controls {
        display: flex;
        gap: 20px;
        justify-content: center;
      }
      
      .pomodoro-btn-large {
        background: #2c1810;
        color: #f4e8d0;
        border: 2px solid #8b6f47;
        padding: 12px 24px;
        font-size: 14px;
        cursor: pointer;
        border-radius: 4px;
        font-family: 'Press Start 2P', monospace;
      }
      
      .pomodoro-btn-large:hover {
        background: #3d2817;
      }
    `;
    document.head.appendChild(style);

    // Corner button (like inventory, bottom-right area)
    this.cornerBtn = document.createElement('button');
    this.cornerBtn.id = 'pomodoro-btn-corner';
    this.cornerBtn.textContent = '🕐';
    this.cornerBtn.addEventListener('click', () => this.show());
    document.body.appendChild(this.cornerBtn);

    // Full-screen panel (central large display)
    this.container = document.createElement('div');
    this.container.id = 'pomodoro-panel';

    // Content wrapper
    const content = document.createElement('div');
    content.className = 'pomodoro-content';

    // Title
    const title = document.createElement('div');
    title.className = 'pomodoro-title';
   
    content.appendChild(title);

    // Timer display (large)
    this.timerDisplay = document.createElement('div');
    this.timerDisplay.className = 'pomodoro-timer-big';
    this.timerDisplay.textContent = this.formatTime(this.remaining);
    content.appendChild(this.timerDisplay);

    // Status text
    this.statusText = document.createElement('div');
    this.statusText.className = 'pomodoro-status';
    this.statusText.textContent = '专注 25 分钟';
    content.appendChild(this.statusText);

    // Controls
    const controls = document.createElement('div');
    controls.className = 'pomodoro-controls';

    // Start/Pause
    this.startBtn = document.createElement('button');
    this.startBtn.textContent = '开始';
    this.startBtn.className = 'pomodoro-btn-large';
    this.startBtn.addEventListener('click', () => this.toggleStart());
    controls.appendChild(this.startBtn);

    // Reset
    this.resetBtn = document.createElement('button');
    this.resetBtn.textContent = '重置';
    this.resetBtn.className = 'pomodoro-btn-large';
    this.resetBtn.addEventListener('click', () => this.reset());
    controls.appendChild(this.resetBtn);

    // Minimize/Close
    this.minimizeBtn = document.createElement('button');
    this.minimizeBtn.textContent = '关闭';
    this.minimizeBtn.className = 'pomodoro-btn-large';
    this.minimizeBtn.addEventListener('click', () => this.minimize());
    controls.appendChild(this.minimizeBtn);

    content.appendChild(controls);
    this.container.appendChild(content);
    document.body.appendChild(this.container);
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  show(autoStart = false) {
    if (this.isVisible) return;
    this.container.classList.add('visible');
    this.isVisible = true;
    this.isMinimized = false;
    if (autoStart) this.start();
  }

  minimize() {
    this.container.classList.remove('visible');
    this.isVisible = false;
    this.isMinimized = true;
  }

  hide() {
    this.minimize();
  }

  toggleStart() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startBtn.textContent = '暂停';

    // Safety: clear existing interval
    if (this.intervalId) clearInterval(this.intervalId);

    const tick = () => {
      if (!this.isRunning) return;
      this.remaining -= 1;
      if (this.remaining < 0) {
        // switch phase
        this.onTimerComplete();
        return;
      }
      this.updateDisplay();
    };

    // Immediate update then set interval
    this.updateDisplay();
    this.intervalId = setInterval(tick, 1000);
  }

  pause() {
    this.isRunning = false;
    this.startBtn.textContent = '开始';
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.pause();
    this.isOnBreak = false;
    this.remaining = this.workDuration;
    this.statusText.textContent = `专注 ${Math.floor(this.workDuration / 60)} 分钟`;
    this.updateDisplay();
  }

  onTimerComplete() {
    this.pause();
    // Toggle between work and break
    if (!this.isOnBreak) {
      // Work finished -> start break
      this.isOnBreak = true;
      this.remaining = this.breakDuration;
      this.statusText.textContent = `休息 ${Math.floor(this.breakDuration / 60)} 分钟`;
      // auto-start break
      this.start();
      // optional notification
      if (this.scene.notifications) this.scene.notifications.info('专注时间到，开始休息', 3000);
    } else {
      // Break finished -> reset to work
      this.isOnBreak = false;
      this.remaining = this.workDuration;
      this.statusText.textContent = `专注 ${Math.floor(this.workDuration / 60)} 分钟`;
      if (this.scene.notifications) this.scene.notifications.success('休息结束，开始下一轮', 3000);
    }

    this.updateDisplay();
  }

  updateDisplay() {
    this.timerDisplay.textContent = this.formatTime(this.remaining);
  }

  destroy() {
    this.pause();
    if (this.container) this.container.remove();
  }
}
