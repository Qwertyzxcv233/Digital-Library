import Phaser from 'phaser';
import Inventory from '../systems/Inventory.js'; // 🆕 导入物品栏
import SocketManager from '../../network/SocketManager.js'; // 🆕 添加这一行

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'player') {
    super(scene, x, y, texture);
    
    // 添加到场景
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    // 设置物理属性
    this.body.setCollideWorldBounds(true);
    this.body.setSize(20, 16); // 碰撞体积（比 sprite 小一点，更自然）
    this.body.setOffset(22, 42); // 调整碰撞体积位置
    
    // 玩家属性
    this.speed = 200;
    this.username = 'You';
    // 🆕 创建物品栏
    this.inventory = new Inventory();
    
    // 创建动画
    this.createAnimations();
    
    // 默认朝下
    this.play('idle-down');
    // 坐下状态
    this.isSitting = false;
    this.currentSeat = null;
    
    // 🆕 创建像素风名字标签
    this.nameText = scene.add.text(x, y - 40, this.username, {
      fontSize: '10px',
      fontFamily: 'Press Start 2P, monospace',
      fill: '#f4e8d0',
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 6, y: 4 },
      resolution: 2
    });
    this.nameText.setOrigin(0.5);
    this.nameText.setStroke('#2c1810', 2);
    // 保证玩家、名字、影子显示顺序：shadow < player < nameText
    // 使用较高的基础 depth 避免与地图层冲突
    this.setDepth(1000);
    this.nameText.setDepth(1001);
    
    // 🆕 添加侧边框效果（像素风）
    // 注意：先确保 nameText 存在
    if (this.nameText) {
      this.nameTextBorder = scene.add.rectangle(
        x, y - 40, 
        this.nameText.width + 8, 
        this.nameText.height + 4,
        0x8b6f47,
        0
      );
      this.nameTextBorder.setStrokeStyle(2, 0x8b6f47, 1);
      this.nameTextBorder.setOrigin(0.5);
      this.nameTextBorder.setDepth(this.nameText.depth - 1);
    }

    // 🆕 添加影子（ellipse），跟随玩家位置
    // 宽度、高度和透明度可以按需调整
    this.shadow = scene.add.ellipse(x, y + 24, 28, 16, 0x000000, 0.35);
    this.shadow.setOrigin(0.5);
    // 放在 nameText 之下，确保不遮挡玩家或名字
    this.shadow.setDepth(999);
    // 如果存在边框，将其置于名字下方但高于影子
    if (this.nameTextBorder) {
      this.nameTextBorder.setDepth(1000);
    }
  }
  
  createAnimations() {
    const scene = this.scene;
    const animsManager = scene.anims;
    
    if (animsManager.exists('walk-down')) return;
    
    // LPC 标准：每行 13 帧
    // 行走动画在行 8-11（刺击位置），每个方向前 9 帧
    
    // 向上 - 行 8
    animsManager.create({
      key: 'walk-up',
      frames: animsManager.generateFrameNumbers('player', { start: 104, end: 112 }),
      frameRate: 8,
      repeat: -1
    });
    
    // 向左 - 行 9
    animsManager.create({
      key: 'walk-left',
      frames: animsManager.generateFrameNumbers('player', { start: 117, end: 125 }),
      frameRate: 8,
      repeat: -1
    });
    
    // 向下 - 行 10
    animsManager.create({
      key: 'walk-down',
      frames: animsManager.generateFrameNumbers('player', { start: 130, end: 138 }),
      frameRate: 8,
      repeat: -1
    });
    
    // 向右 - 行 11
    animsManager.create({
      key: 'walk-right',
      frames: animsManager.generateFrameNumbers('player', { start: 143, end: 151 }),
      frameRate: 8,
      repeat: -1
    });
    
    // 静止帧（每个方向的第一帧）
    animsManager.create({
      key: 'idle-up',
      frames: [{ key: 'player', frame: 104 }],
      frameRate: 1
    });
    
    animsManager.create({
      key: 'idle-left',
      frames: [{ key: 'player', frame: 117 }],
      frameRate: 1
    });
    
    animsManager.create({
      key: 'idle-down',
      frames: [{ key: 'player', frame: 130 }],
      frameRate: 1
    });
    
    animsManager.create({
      key: 'idle-right',
      frames: [{ key: 'player', frame: 143 }],
      frameRate: 1
    });
  }
  
  move(cursors, wasd) {
    // 如果正在坐着，不能移动
    if (this.isSitting) {
      this.body.setVelocity(0, 0);
      return;
    }
    
    let velocityX = 0;
    let velocityY = 0;
    
    // 检测输入
    if (cursors.left.isDown || wasd.a.isDown) {
      velocityX = -this.speed;
    } else if (cursors.right.isDown || wasd.d.isDown) {
      velocityX = this.speed;
    }
    
    if (cursors.up.isDown || wasd.w.isDown) {
      velocityY = -this.speed;
    } else if (cursors.down.isDown || wasd.s.isDown) {
      velocityY = this.speed;
    }
    
    // 设置速度
    this.body.setVelocity(velocityX, velocityY);
    
    // 归一化对角线移动速度
    if (velocityX !== 0 && velocityY !== 0) {
      this.body.velocity.normalize().scale(this.speed);
    }
    
    // 检测是否在移动
    const isMoving = velocityX !== 0 || velocityY !== 0;
    
    // 🆕 如果停止移动，立即停止本地脚步声
    if (!isMoving && this.scene.soundManager) {
      this.scene.soundManager.stopLocalFootsteps(); // ← 只停止自己的
    }
    
    // 播放脚步声（本地）
    if (isMoving && this.scene.soundManager) {
      const played = this.scene.soundManager.playLocalFootstep();
      
      // 如果播放成功（没有被节流），发送网络事件
      if (played) {
        SocketManager.emitSoundEvent('footstep', this.x, this.y);
      }
    }
    
    // 播放动画
    if (velocityX < 0) {
      this.play('walk-left', true);
    } else if (velocityX > 0) {
      this.play('walk-right', true);
    } else if (velocityY < 0) {
      this.play('walk-up', true);
    } else if (velocityY > 0) {
      this.play('walk-down', true);
    } else {
      // 静止时，播放对应方向的静止动画
      const currentAnim = this.anims.currentAnim;
      if (currentAnim) {
        const direction = currentAnim.key.split('-')[1];
        this.play(`idle-${direction}`, true);
      }
    }
  }
  
  update() {
    // 更新名字位置
    this.nameText.setPosition(this.x, this.y - 40);
    
    // 🆕 更新边框位置
    if (this.nameTextBorder) {
      this.nameTextBorder.setPosition(this.x, this.y - 40);
    }
    
    // 🆕 更新影子位置（跟随人物）
    if (this.shadow) {
      this.shadow.setPosition(this.x, this.y + 24);
      // 坐下时缩小影子，站起时恢复
      if (this.isSitting) {
        this.shadow.setScale(0.7, 0.6);
      } else {
        this.shadow.setScale(1, 1);
      }
    }
  }

  getCurrentAnimation() {
    const currentAnim = this.anims.currentAnim;
    if (currentAnim) {
      return currentAnim.key;
    }
    return 'idle-down';
  }

  /**
   * 显示浮动文字（获得物品提示）
   * @param {string} text - 显示的文字
   * @param {string} color - 文字颜色（十六进制）
   */
  showFloatingText(text, color = '#6abe30') {
    const floatingText = this.scene.add.text(this.x, this.y - 60, text, {
      fontSize: '12px',
      fontFamily: 'Press Start 2P, monospace',
      fill: color,
      backgroundColor: 'rgba(26, 20, 16, 0.9)',
      padding: { x: 6, y: 4 },
      resolution: 2
    });
    floatingText.setOrigin(0.5);
    floatingText.setDepth(2000); // 确保在最上层
    
    // 向上飘动 + 淡出动画
    this.scene.tweens.add({
      targets: floatingText,
      y: floatingText.y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => floatingText.destroy()
    });
  }
  
  destroy() {
    this.nameText.destroy();
    
    // 🆕 销毁边框
    if (this.nameTextBorder) {
      this.nameTextBorder.destroy();
    }
    
    // 🆕 销毁影子
    if (this.shadow) {
      this.shadow.destroy();
    }
    
    super.destroy();
  }

}