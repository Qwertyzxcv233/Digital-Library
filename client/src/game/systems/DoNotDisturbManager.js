/**
 * DoNotDisturbManager - 勿扰模式管理器
 * 
 * 功能：
 * 1. 开启/关闭勿扰模式
 * 2. 消息屏蔽（讨论区完全屏蔽，私信静默接收）
 * 3. 声音调整（环境音降低50%，他人动作音静音）
 * 4. 视觉效果（其他玩家半透明，屏幕边缘光晕）
 * 5. 玩家头顶图标（🔕）
 * 6. 多人状态同步
 * 7. 设置持久化（LocalStorage）
 */
export default class DoNotDisturbManager {
  constructor(scene) {
    this.scene = scene;
    this.isEnabled = false;
    this.pomodoroTriggered = false; // 是否由番茄钟触发
    // 保存被勿扰临时修改的音量值（不会立即持久化）
    this._savedBgmVolume = null;
    
    // 🆕 默认设置
    this.defaultSettings = {
      // 消息设置
      muteDiscussion: true,        // 静音讨论区
      mutePrivateMsg: true,        // 🔧 改为 true：静音私信通知（仅角标）
      muteAnnouncement: false,     // 静音公告
      
      // 声音设置
      lowerAmbient: true,          // 降低环境音
      muteOthersFootsteps: true,   // 静音他人脚步声
      muteOthersActions: true,     // 静音他人交互音
      
      // 视觉设置
      dimOtherPlayers: true,       // 其他玩家半透明
      screenEffect: true,          // 屏幕边缘效果
      playerAlpha: 0.5,           // 玩家透明度 (0.3-0.7)
      screenEffectOpacity: 1.0    // 屏幕效果强度 (0-1)
    };
    
    // 加载设置
    this.settings = this.loadSettings();
    
    
    console.log('🔕 DoNotDisturbManager 已初始化');
  }
  
  // ========================================
  // 核心方法
  // ========================================
  
  /**
   * 开启勿扰模式
   */
  enable() {
    if (this.isEnabled) return;
    
    console.log('🔕 开启勿扰模式');
    
    this.isEnabled = true;
    
    // 2. 调整声音
    this.updateSoundSettings();
    
    // 3. 更新视觉效果
    this.updateVisualEffects();
    
    // 4. 更新玩家头顶图标
    this.updatePlayerDNDIcon();
    
    // 5. 同步到服务器
    this.syncToServer();
    
    // 6. 通知用户
    if (this.scene.notifications) {
      this.scene.notifications.info('🔕 勿扰模式已开启', 2000);
    }
    
    // 7. 更新消息中心UI（刷新讨论区状态）
    if (this.scene.messageCenter) {
      this.scene.messageCenter.updateUI();
    }
  }
  
  /**
   * 关闭勿扰模式
   */
  disable() {
    if (!this.isEnabled) return;
    
    console.log('🔔 关闭勿扰模式');
    
    this.isEnabled = false;
    
    // 1. 恢复声音
    this.restoreSoundSettings();
    
    // 2. 恢复视觉效果
    this.restoreVisualEffects();
    
    // 3. 移除玩家头顶图标
    this.updatePlayerDNDIcon();
    
    // 4. 同步到服务器
    this.syncToServer();
    
    // 5. 通知用户
    if (this.scene.notifications) {
      this.scene.notifications.success('🔔 勿扰模式已关闭', 2000);
    }
    
    // 6. 更新消息中心UI（刷新讨论区状态）
    if (this.scene.messageCenter) {
      this.scene.messageCenter.updateUI();
    }
  }
  
  /**
   * 切换勿扰模式
   */
  toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
  }
  
  // ========================================
  // 消息处理
  // ========================================
  
  /**
   * 检查是否应该显示消息
   * @param {string} channel - 频道类型 ('announcement' / 'area' / 'private')
   * @param {string} messageType - 消息类型 ('system' / 'me' / 'other')
   * @returns {boolean}
   */
  shouldShowMessage(channel, messageType) {
    if (!this.isEnabled) return true; // 未开启勿扰，正常显示
    
    // 自己的消息始终显示
    if (messageType === 'me') return true;
    
    // 根据设置判断
    if (channel === 'announcement') {
      return !this.settings.muteAnnouncement;
    }
    
    if (channel === 'area') {
      return !this.settings.muteDiscussion;
    }
    
    if (channel === 'private') {
      // 私信：静默接收（显示但不弹窗通知）
      return true; // 始终接收，只是不显示浮动通知
    }
    
    return true;
  }
  
  /**
   * 检查是否应该显示浮动通知
   * @param {string} channel - 频道类型
   * @returns {boolean}
   */
  shouldShowToast(channel) {
    if (!this.isEnabled) return true;
    
    if (channel === 'announcement') {
      return !this.settings.muteAnnouncement;
    }
    
    if (channel === 'area') {
      return !this.settings.muteDiscussion;
    }
    
    if (channel === 'private') {
      return !this.settings.mutePrivateMsg; // 私信静默
    }
    
    return true;
  }
  
  // ========================================
  // 声音调整
  // ========================================
  

  
  /**
   * 更新声音设置（勿扰模式下）
   */
  updateSoundSettings() {
    if (!this.scene.soundManager) return;
    
    const soundManager = this.scene.soundManager;
    
    // 1. 降低环境音到当前的 50%
    if (this.settings.lowerAmbient && soundManager.currentAmbient) {
      // 🔧 获取区域类型和配置
      const regionType = soundManager.getCurrentRegionType();
      const config = soundManager.ambientConfig[regionType];
      
      if (config) {
        // 🔧 计算勿扰模式下的音量
        // 勿扰音量 = 配置音量 × 环境音设置 × 主音量 × 0.5
        const dndVolume = config.volume * soundManager.volumes.ambient * soundManager.volumes.master * 0.5;
        
        // 平滑过渡
        this.scene.tweens.add({
          targets: soundManager.currentAmbient,
          volume: dndVolume,
          duration: 200,
          ease: 'Linear'
        });
        
        console.log(`🔉 环境音降低到 50%: ${dndVolume.toFixed(3)}`);
      }
    }
    
    console.log(' 声音设置已更新');
    // 🆕 额外：勿扰模式下静音 BGM（临时，不覆盖用户设置）
    try {
      // 保存原始 BGM 值（仅第一次开启时保存）
      if (this._savedBgmVolume === null && Number.isFinite(soundManager.volumes.bgm)) {
        this._savedBgmVolume = soundManager.volumes.bgm;
      }

      // 直接修改内存中 bgm 值并更新正在播放的实例音量（不写入 LocalStorage）
      soundManager.volumes.bgm = 0;
      if (soundManager.bgmInstance) {
        soundManager.bgmInstance.setVolume((Number.isFinite(soundManager.volumes.master) ? soundManager.volumes.master : 1) * 0);
      }
      console.log('🔕 勿扰模式：BGM 已静音（临时）');
    } catch (e) {
      console.warn('⚠️ 尝试静音 BGM 时出错', e);
    }
  }
  
  /**
   * 恢复声音设置
   */
  restoreSoundSettings() {
    if (!this.scene.soundManager) return;
    
    const soundManager = this.scene.soundManager;
    
    // 1. 恢复环境音
    if (this.settings.lowerAmbient && soundManager.currentAmbient) {
      // 🔧 获取区域类型和配置
      const regionType = soundManager.getCurrentRegionType();
      const config = soundManager.ambientConfig[regionType];
      
      if (config) {
        // 🔧 恢复到正常音量（不使用保存的音量，直接使用当前设置）
        // 正常音量 = 配置音量 × 环境音设置 × 主音量
        const normalVolume = config.volume * soundManager.volumes.ambient * soundManager.volumes.master;
        
        // 平滑过渡
        this.scene.tweens.add({
          targets: soundManager.currentAmbient,
          volume: normalVolume,
          duration: 200,
          ease: 'Linear'
        });
        
        console.log(`🔊 环境音恢复: ${normalVolume.toFixed(3)}`);
      }
    }
    
    console.log('🔊 声音设置已恢复');
    // 🆕 恢复之前保存的 BGM 音量（如果存在），不自动持久化除非用户手动调整
    try {
      if (this._savedBgmVolume !== null) {
        // 恢复到内存值
        soundManager.volumes.bgm = this._savedBgmVolume;
        // 更新正在播放的实例
        if (soundManager.bgmInstance) {
          const m = Number.isFinite(soundManager.volumes.master) ? soundManager.volumes.master : 1;
          const b = Number.isFinite(soundManager.volumes.bgm) ? soundManager.volumes.bgm : 1;
          soundManager.bgmInstance.setVolume(m * b);
        }
        console.log(`🔔 勿扰结束：BGM 恢复到 ${this._savedBgmVolume}`);
        this._savedBgmVolume = null;
      }
    } catch (e) {
      console.warn('⚠️ 恢复 BGM 音量时出错', e);
    }
  }
  
  /**
   * 检查是否应该播放远程声音（他人的声音）
   * @param {string} soundType - 声音类型
   * @returns {boolean}
   */
  shouldPlayRemoteSound(soundType) {
    if (!this.isEnabled) return true;
    
    // 脚步声
    if (soundType === 'footstep') {
      return !this.settings.muteOthersFootsteps;
    }
    
    // 其他交互音（打印机、闸机等）
    return !this.settings.muteOthersActions;
  }
  
  // ========================================
  // 视觉效果
  // ========================================
  
  /**
   * 更新视觉效果（勿扰模式下）
   */
  updateVisualEffects() {
    // 1. 其他玩家半透明
    if (this.settings.dimOtherPlayers) {
      this.updateOtherPlayersAlpha(this.settings.playerAlpha);
    }
    
    // 2. 屏幕边缘效果
    if (this.settings.screenEffect) {
      this.showScreenEffect(this.settings.screenEffectOpacity);
    }
  }
  
  /**
   * 恢复视觉效果
   */
  restoreVisualEffects() {
    // 1. 恢复其他玩家透明度
    if (this.settings.dimOtherPlayers) {
      this.updateOtherPlayersAlpha(1.0);
    }
    
    // 2. 隐藏屏幕效果
    if (this.settings.screenEffect) {
      this.hideScreenEffect();
    }
  }
  
  /**
   * 更新其他玩家的透明度
   * @param {number} alpha - 目标透明度 (0-1)
   */
  updateOtherPlayersAlpha(alpha) {
    if (!this.scene.otherPlayers) return;
    
    this.scene.otherPlayers.forEach((otherPlayer) => {
      // 使用 Tween 平滑过渡
      this.scene.tweens.add({
        targets: otherPlayer,
        alpha: alpha,
        duration: 300,
        ease: 'Sine.easeInOut'
      });
      
      // 名字也半透明
      if (otherPlayer.nameText) {
        this.scene.tweens.add({
          targets: otherPlayer.nameText,
          alpha: alpha,
          duration: 300,
          ease: 'Sine.easeInOut'
        });
      }
      
      // 名字边框也半透明
      if (otherPlayer.nameTextBorder) {
        this.scene.tweens.add({
          targets: otherPlayer.nameTextBorder,
          alpha: alpha,
          duration: 300,
          ease: 'Sine.easeInOut'
        });
      }
    });
    
    console.log(`👥 其他玩家透明度更新: ${alpha}`);
  }
  
  /**
   * 显示屏幕边缘效果
   * @param {number} opacity - 效果强度 (0-1)
   */
  showScreenEffect(opacity) {
    const overlay = document.getElementById('dnd-overlay');
    if (!overlay) {
      console.warn('⚠️ 未找到 #dnd-overlay 元素');
      return;
    }
    
    overlay.style.opacity = opacity;
    console.log(`✨ 屏幕效果已显示 (强度: ${opacity})`);
  }
  
  /**
   * 隐藏屏幕边缘效果
   */
  hideScreenEffect() {
    const overlay = document.getElementById('dnd-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      console.log('✨ 屏幕效果已隐藏');
    }
  }
  
  // ========================================
  // 玩家头顶图标
  // ========================================
  
  /**
   * 更新玩家头顶的勿扰图标
   */
  updatePlayerDNDIcon() {
    const player = this.scene.player;
    if (!player) return;
    
    // 移除旧图标
    if (player.dndIcon) {
      player.dndIcon.destroy();
      player.dndIcon = null;
    }
    
    // 如果勿扰模式开启，添加图标
    if (this.isEnabled) {
      player.dndIcon = this.scene.add.text(
        player.x + player.nameText.width / 2 + 8, // 名字右侧
        player.y - 40,
        '🔕',
        {
          fontSize: '12px',
          color: '#f4e8d0',
          resolution: 2
        }
      );
      player.dndIcon.setOrigin(0, 0.5);
      player.dndIcon.setDepth(player.nameText.depth);
      
      console.log('🔕 头顶图标已显示');
    } else {
      console.log('🔔 头顶图标已移除');
    }
  }
  
  /**
   * 更新其他玩家的勿扰图标
   * @param {string} playerId - 玩家ID
   * @param {boolean} isDND - 是否勿扰
   */
  updateRemotePlayerDNDIcon(playerId, isDND) {
    const otherPlayer = this.scene.otherPlayers.get(playerId);
    if (!otherPlayer) return;
    
    // 移除旧图标
    if (otherPlayer.dndIcon) {
      otherPlayer.dndIcon.destroy();
      otherPlayer.dndIcon = null;
    }
    
    // 如果勿扰模式开启，添加图标
    if (isDND) {
      otherPlayer.dndIcon = this.scene.add.text(
        otherPlayer.x + otherPlayer.nameText.width / 2 + 8,
        otherPlayer.y - 40,
        '🔕',
        {
          fontSize: '12px',
          color: '#f4e8d0',
          resolution: 2
        }
      );
      otherPlayer.dndIcon.setOrigin(0, 0.5);
      otherPlayer.dndIcon.setDepth(otherPlayer.nameText.depth);
      
      console.log(`🔕 ${otherPlayer.username} 开启了勿扰模式`);
    }
  }
  
  // ========================================
  // 网络同步
  // ========================================
  
  /**
   * 同步勿扰状态到服务器
   */
  syncToServer() {
    if (!this.scene.socketManager) return;
    
    // 使用 SocketManager 的方法发送
    this.scene.socketManager.emitDNDChange(this.isEnabled);
    
    console.log(`📡 勿扰状态已同步到服务器: ${this.isEnabled}`);
  }
  
  /**
   * 处理其他玩家的勿扰状态变化
   * @param {string} playerId - 玩家ID
   * @param {boolean} isDND - 是否勿扰
   */
  handleRemoteChange(playerId, isDND) {
    this.updateRemotePlayerDNDIcon(playerId, isDND);
  }
  
  // ========================================
  // 设置管理
  // ========================================
  
  /**
   * 从 LocalStorage 加载设置
   * @returns {object}
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('dlib-dnd-settings');
      if (saved) {
        const savedSettings = JSON.parse(saved);
        console.log('🔕 从 LocalStorage 加载勿扰设置:', savedSettings);
        return { ...this.defaultSettings, ...savedSettings };
      }
    } catch (error) {
      console.error('⚠️ 加载勿扰设置失败:', error);
    }
    
    console.log('ℹ️ 使用默认勿扰设置');
    return { ...this.defaultSettings };
  }
  
  /**
   * 保存设置到 LocalStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('dlib-dnd-settings', JSON.stringify(this.settings));
      console.log('💾 勿扰设置已保存到 LocalStorage');
    } catch (error) {
      console.error('⚠️ 保存勿扰设置失败:', error);
    }
  }
  
  /**
   * 更新设置项
   * @param {string} key - 设置键
   * @param {any} value - 设置值
   */
  updateSetting(key, value) {
    this.settings[key] = value;
    this.saveSettings();
    
    // 如果勿扰模式开启，立即应用更改
    if (this.isEnabled) {
      if (key.startsWith('mute') || key.startsWith('lower')) {
        this.updateSoundSettings();
      } else if (key.startsWith('dim') || key.startsWith('screen') || key === 'playerAlpha' || key === 'screenEffectOpacity') {
        this.updateVisualEffects();
      }
    }
    
    console.log(`⚙️ 设置已更新: ${key} = ${value}`);
  }
  
  // ========================================
  // 番茄钟接口
  // ========================================
  
  /**
   * 由番茄钟触发开启勿扰
   */
  enableByPomodoro() {
    this.pomodoroTriggered = true;
    this.enable();
    
    if (this.scene.notifications) {
      this.scene.notifications.info('🍅 番茄钟已开始，勿扰模式已开启', 2500);
    }
  }
  
  /**
   * 由番茄钟触发关闭勿扰
   */
  disableByPomodoro() {
    if (this.pomodoroTriggered) {
      this.disable();
      this.pomodoroTriggered = false;
      
      if (this.scene.notifications) {
        this.scene.notifications.success('🍅 番茄钟完成，勿扰模式已关闭', 2500);
      }
    }
  }
  
  // ========================================
  // 更新循环（在 Player.update() 中调用）
  // ========================================
  
  /**
   * 更新勿扰图标位置（跟随玩家移动）
   */
  update() {
    // 更新本地玩家的勿扰图标位置
    const player = this.scene.player;
    if (player && player.dndIcon) {
      player.dndIcon.setPosition(
        player.x + player.nameText.width / 2 + 8,
        player.y - 40
      );
    }
    
    // 更新其他玩家的勿扰图标位置
    if (this.scene.otherPlayers) {
      this.scene.otherPlayers.forEach((otherPlayer) => {
        if (otherPlayer.dndIcon) {
          otherPlayer.dndIcon.setPosition(
            otherPlayer.x + otherPlayer.nameText.width / 2 + 8,
            otherPlayer.y - 40
          );
        }
      });
    }
  }
  
  // ========================================
  // 销毁
  // ========================================
  
  /**
   * 销毁管理器
   */
  destroy() {
    // 关闭勿扰模式
    if (this.isEnabled) {
      this.disable();
    }
    
    console.log('🗑️ DoNotDisturbManager 已销毁');
  }
}