import Interactable from './Interactable.js';
import SocketManager from '../../network/SocketManager.js';

export default class Seat extends Interactable {
  constructor(scene, x, y, direction = 'down', texture = 'chair', frame = 0) {
    super(scene, x, y, texture, {
      promptText: '按 E 坐下'
    });
    
    this.direction = direction;
    this.occupied = false;
    this.occupant = null;
    
    if (frame !== undefined && this.texture.has(frame)) {
      this.setFrame(frame);
    } else {
      this.setFrame(0);
    }
    
    this.setDepth(y);
    this.setupMouseInteraction();
  }
  
  // 静态方法：获取坐姿帧号
  static getSittingFrame(direction) {
    const frameMap = {
      'down': 418,
      'left': 405,
      'right': 431,
      'up': 392
    };
    return frameMap[direction] || 418;
  }
  
  // 静态方法：获取坐下Y偏移
  static getSitYOffset(direction) {
    const offsetMap = {
      'down': -12,
      'up': -14,
      'left': -18,
      'right': -18
    };
    return offsetMap[direction] || -12;
  }
  
  setupMouseInteraction() {
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-8, -8, 48, 48),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });
    
    this.on('pointerover', () => {
      this.onMouseOver();
    });
    
    this.on('pointerout', () => {
      this.onMouseOut();
    });
    
    this.on('pointerdown', (pointer) => {
      this.onMouseClick(pointer);
    });
  }
  
  onMouseOver() {
    if (!this.canInteract) return;
    
    this.setTint(0xffff99);
    
    const player = this.scene.player;
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      this.x, this.y
    );
    
    if (distance < 60) {
      this.showPrompt();
    } else {
      this.showDistanceHint();
    }
  }
  
  onMouseOut() {
    this.clearTint();
    this.hidePrompt();
    this.hideDistanceHint();
  }
  
  onMouseClick(pointer) {
    const player = this.scene.player;
    
    const distance = Phaser.Math.Distance.Between(
      player.x, player.y,
      this.x, this.y
    );
    
    if (distance < 60) {
      this.interact(player);
    } else {
      this.showTooFarMessage();
    }
  }
  
  showDistanceHint() {
    if (this.distanceHint) return;
    
    this.distanceHint = this.scene.add.text(this.x, this.y - 65, '点击坐下', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P, monospace',
      fill: '#f4e8d0',
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 8, y: 6 },
      resolution: 2
    });
    this.distanceHint.setOrigin(0.5);
    this.distanceHint.setDepth(1001);
    
    this.distanceHintBorder = this.scene.add.rectangle(
      this.x, this.y - 65,
      this.distanceHint.width + 4,
      this.distanceHint.height + 4,
      0x8b6f47,
      0
    );
    this.distanceHintBorder.setStrokeStyle(2, 0x8b6f47, 1);
    this.distanceHintBorder.setOrigin(0.5);
    this.distanceHintBorder.setDepth(1000);
  }
  
  hideDistanceHint() {
    if (this.distanceHint) {
      this.distanceHint.destroy();
      this.distanceHint = null;
    }
    if (this.distanceHintBorder) {
      this.distanceHintBorder.destroy();
      this.distanceHintBorder = null;
    }
  }
  
  showTooFarMessage() {
    const msg = this.scene.add.text(this.x, this.y - 70, '太远了，走近一点', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P, monospace',
      fill: '#f4e8d0',
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 8, y: 6 },
      resolution: 2
    });
    msg.setOrigin(0.5);
    msg.setDepth(1001);
    
    const msgBorder = this.scene.add.rectangle(
      this.x, this.y - 70,
      msg.width + 4,
      msg.height + 4,
      0xff6c11,
      0
    );
    msgBorder.setStrokeStyle(2, 0xff6c11, 1);
    msgBorder.setOrigin(0.5);
    msgBorder.setDepth(1000);
    
    msg.setAlpha(0);
    msgBorder.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [msg, msgBorder],
      alpha: 1,
      y: this.y - 75,
      duration: 200,
      ease: 'Cubic.easeOut'
    });
    
    this.scene.time.delayedCall(1500, () => {
      this.scene.tweens.add({
        targets: [msg, msgBorder],
        alpha: 0,
        y: this.y - 80,
        duration: 200,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          msg.destroy();
          msgBorder.destroy();
        }
      });
    });
  }
  
  showOccupiedMessage() {
    const msg = this.scene.add.text(this.x, this.y - 70, '座位已被占用', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P, monospace',
      fill: '#f4e8d0',
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 8, y: 6 },
      resolution: 2
    });
    msg.setOrigin(0.5);
    msg.setDepth(1001);
    
    const msgBorder = this.scene.add.rectangle(
      this.x, this.y - 70,
      msg.width + 4,
      msg.height + 4,
      0xd95763,
      0
    );
    msgBorder.setStrokeStyle(2, 0xd95763, 1);
    msgBorder.setOrigin(0.5);
    msgBorder.setDepth(1000);
    
    msg.setAlpha(0);
    msgBorder.setAlpha(0);
    
    this.scene.tweens.add({
      targets: [msg, msgBorder],
      alpha: 1,
      y: this.y - 75,
      duration: 200,
      ease: 'Cubic.easeOut'
    });
    
    this.scene.time.delayedCall(1000, () => {
      this.scene.tweens.add({
        targets: [msg, msgBorder],
        alpha: 0,
        y: this.y - 80,
        duration: 200,
        ease: 'Cubic.easeIn',
        onComplete: () => {
          msg.destroy();
          msgBorder.destroy();
        }
      });
    });
  }
  
  interact(player) {
    if (player.isSitting) {
      if (player.currentSeat === this) {
        this.standUp(player);
      }
    } else if (!this.occupied) {
      this.sitDown(player);
    } else {
      this.showOccupiedMessage();
    }
  }
  
  sitDown(player) {
    this.occupied = true;
    this.occupant = player;
    
    player.isSitting = true;
    player.currentSeat = this;
    
    const sitYOffset = Seat.getSitYOffset(this.direction);
    const finalX = this.x;
    const finalY = this.y + sitYOffset;
    
    player.setPosition(finalX, finalY);
    player.body.setVelocity(0, 0);
    
    player.anims.stop();
    const sittingFrame = Seat.getSittingFrame(this.direction);
    player.setFrame(sittingFrame);
    
    const playerY = this.y + sitYOffset;
    
    if (this.direction === 'up') {
      this.setDepth(playerY + 10);
      player.setDepth(playerY - 10);
    } else {
      this.setDepth(playerY - 10);
      player.setDepth(playerY + 10);
    }
    
    this.promptText = '按 E 站起';
    this.prompt.setText(this.promptText);
    
    SocketManager.emitSit(
      this.getData('id'),
      finalX,
      finalY,
      this.direction
    );

    // 🆕 如果是本地玩家，显示番茄钟面板（不自动开始，用户可按开始）
    try {
      if (player === this.scene.player && this.scene.pomodoroPanel) {
        this.scene.pomodoroPanel.show(false);
      }
    } catch (e) {
      console.warn('⚠️ 显示番茄钟时出错', e);
    }
  }
  
  standUp(player) {
    this.occupied = false;
    this.occupant = null;
    
    player.isSitting = false;
    player.currentSeat = null;
    
    const standOffset = this.getStandOffset(this.direction);
    player.setPosition(this.x + standOffset.x, this.y + standOffset.y);
    
    const idleAnim = 'idle-' + this.direction;
    if (player.anims.exists(idleAnim)) {
      player.play(idleAnim);
    } else {
      player.play('idle-down');
    }
    
    player.setDepth(player.y);
    this.setDepth(this.y);
    
    this.promptText = '按 E 坐下';
    this.prompt.setText(this.promptText);
    
    SocketManager.emitStandUp();
    SocketManager.emitMove(player.x, player.y, player.getCurrentAnimation());

    // 🆕 如果是本地玩家，隐藏番茄钟面板
    try {
      if (player === this.scene.player && this.scene.pomodoroPanel) {
        this.scene.pomodoroPanel.hide();
      }
    } catch (e) {
      console.warn('⚠️ 隐藏番茄钟时出错', e);
    }
  }
  
  getStandOffset(direction) {
    const offsets = {
      'down': { x: 0, y: 20 },
      'up': { x: 0, y: -20 },
      'left': { x: -20, y: 0 },
      'right': { x: 20, y: 0 }
    };
    return offsets[direction] || { x: 0, y: 20 };
  }
  
  setOccupiedByOther(otherPlayer) {
    this.occupied = true;
    this.occupant = otherPlayer;
    this.canInteract = false;
    this.disableInteractive();
  }
  
  releaseByOther() {
    this.occupied = false;
    this.occupant = null;
    this.canInteract = true;
    
    this.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(-8, -8, 48, 48),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true
    });
  }
  
  destroy() {
    this.hideDistanceHint();
    super.destroy();
  }
}