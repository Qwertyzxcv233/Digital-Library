import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // 显示加载进度
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);
  
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        fill: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
  
    this.load.on('progress', (value) => {
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
    });
  
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });
  
    // 加载地图的 tileset 图像
    this.load.image('library-tiles', 'assets/tilesets/library-tileset.png');

    // 🆕 加载地毯 tileset
    this.load.image('carpet-gray-dark', 'assets/tilesets/carpet-gray-dark.png');
    
    // 🆕 加载椅子贴图
    this.load.image('chair', 'assets/tilesets/chair.png');

    // 🆕 加载灰色椅子 spritesheet
    this.load.spritesheet('chair-gray', 'assets/tilesets/chair-gray.png', {
      frameWidth: 32,
      frameHeight: 32
    });

    // 🆕 加载木桌子
    this.load.image('table-wood', 'assets/tilesets/table-wood.png');

    // 🆕 加载墙纸图块集（spritesheet）
    this.load.spritesheet('wall-paper-beige', 'assets/tilesets/wall-paper-beige.png', {
      frameWidth: 32,   // ← 每个图块宽 32
      frameHeight: 64   // ← 每个图块高 64
    });

    // 🆕 加载打印机 spritesheet
    this.load.spritesheet('printer', 'assets/tilesets/printer.png', {
      frameWidth: 64,
      frameHeight: 64
    });

    // 🆕 加载闸机 spritesheet（新增）
    this.load.spritesheet('gate', 'assets/tilesets/gate.png', {
      frameWidth: 64,
      frameHeight: 64
    });


    // 🆕🆕🆕 加载前台接待处整图（新增）⭐
    this.load.image('reception', 'assets/tilesets/reception.png');
  
    // 加载地图 JSON
    this.load.tilemapTiledJSON('level2-map', 'assets/maps/level2.json');
  
    // 加载角色 spritesheet
    this.load.spritesheet('player', 'assets/characters/player.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  
    // ========================================
    // 🆕 加载声音文件
    // ========================================
    
    // 环境音（底噪）
    this.load.audio('ambient-study', 'assets/sounds/ambient-study.wav');
    this.load.audio('ambient-discussion', 'assets/sounds/keyboard.wav');   // 占位
    this.load.audio('ambient-leisure', 'assets/sounds/keyboard.wav');      // 占位
    this.load.audio('ambient-public', 'assets/sounds/ambient-public.wav');
      // 背景音乐（BGM）
    this.load.audio('bgm-01', 'assets/sounds/DL_bgm1.mp3');
    this.load.audio('bgm-02', 'assets/sounds/DL_bgm2.mp3');
    this.load.audio('bgm-03', 'assets/sounds/DL_bgm3.mp3');
    
    // 脚步声
    this.load.audio('footstep-01', 'assets/sounds/footstep-01.wav');
    this.load.audio('footstep-02', 'assets/sounds/footstep-02.wav');
    this.load.audio('footstep-03', 'assets/sounds/footstep-03.wav');
    this.load.audio('footstep-04', 'assets/sounds/footstep-04.wav');
    
    // 椅子声音（占位）
    this.load.audio('chair-sit', 'assets/sounds/keyboard.wav');
    this.load.audio('chair-standup', 'assets/sounds/keyboard.wav');
    
    // 打印机声音
    this.load.audio('printer-complete', 'assets/sounds/printer-complete.wav');
    
    // 🆕 闸机声音（占位音：使用打印机音效）
    // 未来可以替换成真实的 gate-beep.wav
    this.load.audio('gate-beep', 'assets/sounds/gate-beep.wav');
    
    console.log('🎵 声音文件加载完成（当前使用占位音）');
    console.log('🚪 闸机资源加载完成');
  }

  create() {
    console.log('BootScene: 资源加载完成');
    this.scene.start('Level2Scene');
  }
}