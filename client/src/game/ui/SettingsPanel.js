/**
 * SettingsPanel - 设置面板
 * 
 * 功能：
 * 1. 声音设置 - 4 个音量滑块 + 静音 + 重置
 * 2. 关于页面 - 项目信息
 * 3. Tab 切换
 * 4. 像素风 UI
 */
export default class SettingsPanel {
  constructor(scene) {
    this.scene = scene;
    this.isVisible = false;
    this.currentTab = 'sound'; // 'sound' or 'about'
    this.isMuted = false;
    
    // 音量配置
    this.volumeConfigs = [
      {
        id: 'master',
        label: '主音量',
        icon: '🔊',
        defaultValue: 1.0,
        category: 'master',
        description: '控制所有声音'
      },
      {
        id: 'bgm',
        label: '音乐',
        icon: '🎵',
        defaultValue: 0.6,
        category: 'bgm',
        description: '控制背景音乐的音量'
      },
      {
        id: 'ambient',
        label: '环境音',
        icon: '🌳',
        defaultValue: 0.3,
        category: 'ambient',
        description: '区域背景音'
      },
      {
        id: 'effects',
        label: '效果音',
        icon: '🔔',
        defaultValue: 0.8,
        category: 'effects',
        description: '交互音效'
      },
      {
        id: 'footsteps',
        label: '脚步声',
        icon: '👣',
        defaultValue: 0.5,
        category: 'footsteps',
        description: '玩家脚步声'
      }
    ];

    // 🆕 勿扰模式配置
    this.dndConfigs = {
      message: {
        title: '💬 消息设置',
        options: [
          {
            id: 'muteDiscussion',
            label: '静音讨论区',
            description: '勿扰时不显示讨论区消息',
            default: true
          },
          {
            id: 'mutePrivateMsg',
            label: '静音私信通知',
            description: '勿扰时私信静默接收（仅显示角标）',
            default: true
          },
          {
            id: 'muteAnnouncement',
            label: '静音系统公告',
            description: '勿扰时不显示系统公告',
            default: false
          }
        ]
      },
      sound: {
        title: '🔊 声音设置',
        options: [
          {
            id: 'lowerAmbient',
            label: '降低环境音',
            description: '勿扰时环境音降低到50%',
            default: true
          },
          {
            id: 'muteOthersFootsteps',
            label: '静音他人脚步声',
            description: '勿扰时听不到其他玩家的脚步声',
            default: true
          },
          {
            id: 'muteOthersActions',
            label: '静音他人交互音',
            description: '勿扰时听不到其他玩家的交互声音',
            default: true
          }
        ]
      },
      visual: {
        title: '👁️ 视觉设置',
        options: [
          {
            id: 'dimOtherPlayers',
            label: '其他玩家半透明',
            description: '勿扰时其他玩家变半透明',
            default: true
          },
          {
            id: 'screenEffect',
            label: '屏幕边缘效果',
            description: '勿扰时屏幕边缘显示金色光晕',
            default: true
          }
        ],
        sliders: [
          {
            id: 'playerAlpha',
            label: '玩家透明度',
            icon: '👥',
            min: 0.3,
            max: 0.7,
            step: 0.1,
            default: 0.5,
            description: '其他玩家的透明度（值越小越透明）',
            format: (value) => `${Math.round(value * 100)}%`
          },
          {
            id: 'screenEffectOpacity',
            label: '效果强度',
            icon: '✨',
            min: 0,
            max: 1,
            step: 0.1,
            default: 1.0,
            description: '屏幕边缘效果的强度',
            format: (value) => `${Math.round(value * 100)}%`
          }
        ]
      }
    };
    
    this.createPanel();
    this.hide(); // 默认隐藏
    
    console.log('⚙️ SettingsPanel 已初始化');
  }
  
  /**
   * 创建设置面板
   */
  createPanel() {
    // 创建背景遮罩
    this.overlay = document.createElement('div');
    this.overlay.id = 'settings-overlay';
    this.overlay.className = 'settings-overlay';
    this.overlay.addEventListener('click', () => this.hide());
    
    // 创建面板容器
    this.panel = document.createElement('div');
    this.panel.id = 'settings-panel';
    this.panel.className = 'settings-panel';
    
    // 阻止点击面板时关闭
    this.panel.addEventListener('click', (e) => e.stopPropagation());
    
    // 创建标题
    const header = document.createElement('div');
    header.className = 'settings-header';
    header.innerHTML = '<h2>⚙️ 设置</h2>';
    this.panel.appendChild(header);
    
    // 创建 Tab 切换
    const tabs = document.createElement('div');
    tabs.className = 'settings-tabs';
    
    this.soundTab = this.createTabButton('🔊 声音设置', 'sound');
    this.dndTab = this.createTabButton('🔕 勿扰设置', 'dnd'); // 🆕 添加勿扰标签
    this.aboutTab = this.createTabButton('ℹ️ 关于', 'about');
    
    tabs.appendChild(this.soundTab);
    tabs.appendChild(this.dndTab); // 🆕 添加到 DOM
    tabs.appendChild(this.aboutTab);
    this.panel.appendChild(tabs);
    
    // 创建内容区域
    this.contentArea = document.createElement('div');
    this.contentArea.className = 'settings-content';
    this.panel.appendChild(this.contentArea);
    
    // 创建两个页面
    this.soundContent = this.createSoundTab();
    this.dndContent = this.createDNDTab(); // 🆕 创建勿扰设置页
    this.aboutContent = this.createAboutTab();
    
    // 初始显示声音设置
    this.contentArea.appendChild(this.soundContent);
    
    // 创建底部按钮
    const footer = document.createElement('div');
    footer.className = 'settings-footer';
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.className = 'settings-button settings-button-primary';
    closeButton.addEventListener('click', () => this.hide());
    
    footer.appendChild(closeButton);
    this.panel.appendChild(footer);
    
    // 添加到 body
    document.body.appendChild(this.overlay);
    document.body.appendChild(this.panel);
    
    console.log('✅ 设置面板 DOM 已创建');
  }
  
  /**
   * 创建 Tab 按钮
   */
  createTabButton(text, tabName) {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = 'settings-tab';
    button.dataset.tab = tabName;
    
    if (tabName === this.currentTab) {
      button.classList.add('active');
    }
    
    button.addEventListener('click', () => this.switchTab(tabName));
    
    return button;
  }
  
  /**
   * 创建声音设置页
   */
  createSoundTab() {
    const container = document.createElement('div');
    container.className = 'settings-tab-content';
    container.id = 'sound-tab';
    
    // 标题
    const title = document.createElement('h3');
    title.textContent = '🔊 声音设置';
    title.className = 'settings-section-title';
    container.appendChild(title);
    
    // 创建音量滑块
    this.volumeConfigs.forEach(config => {
      const sliderContainer = this.createVolumeSlider(config);
      container.appendChild(sliderContainer);
    });
    
    // 按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'settings-button-group';
    
    // 静音按钮
    this.muteButton = document.createElement('button');
    this.muteButton.textContent = '🔇 静音';
    this.muteButton.className = 'settings-button';
    this.muteButton.addEventListener('click', () => this.toggleMute());
    buttonContainer.appendChild(this.muteButton);
    
    // 重置按钮
    const resetButton = document.createElement('button');
    resetButton.textContent = '🔄 重置默认';
    resetButton.className = 'settings-button';
    resetButton.addEventListener('click', () => this.resetToDefaults());
    buttonContainer.appendChild(resetButton);
    
    container.appendChild(buttonContainer);
    
    return container;
  }
  
  /**
   * 创建音量滑块
   */
  createVolumeSlider(config) {
    const container = document.createElement('div');
    container.className = 'volume-slider-container';
    
    // 🆕 从 soundManager 获取当前音量（如果已加载）
    let currentValue = config.defaultValue;
    if (this.scene.soundManager && this.scene.soundManager.volumes[config.category] !== undefined) {
      currentValue = this.scene.soundManager.volumes[config.category];
    }
    
    // 标签和数值显示
    const labelRow = document.createElement('div');
    labelRow.className = 'volume-slider-label';
    
    const label = document.createElement('span');
    label.textContent = `${config.icon} ${config.label}`;
    label.className = 'volume-label-text';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.id = `volume-value-${config.id}`;
    valueDisplay.textContent = `${Math.round(currentValue * 100)}%`; // 🆕 使用当前音量
    valueDisplay.className = 'volume-value';
    
    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);
    container.appendChild(labelRow);
    
    // 滑块
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = `slider-${config.id}`;
    slider.className = 'volume-slider';
    slider.min = '0';
    slider.max = '100';
    slider.value = Math.round(currentValue * 100); // 🆕 使用当前音量
    slider.dataset.category = config.category;
    
    // 实时更新
    slider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      const normalizedValue = value / 100;
      
      // 更新显示
      valueDisplay.textContent = `${value}%`;
      
      // 🆕 更新音量（会自动保存到 LocalStorage）
      this.updateVolume(config.category, normalizedValue);
    });
    
    container.appendChild(slider);
    
    // 描述
    const description = document.createElement('div');
    description.className = 'volume-description';
    description.textContent = config.description;
    container.appendChild(description);
    
    return container;
  }

  /**
   * 创建勿扰设置页
   */
  createDNDTab() {
    
    const container = document.createElement('div');
    container.className = 'settings-tab-content';
    container.id = 'dnd-tab';
    container.style.display = 'none';
    
    // 标题
    const title = document.createElement('h3');
    title.textContent = '🔕 勿扰设置';
    title.className = 'settings-section-title';
    container.appendChild(title);
    
    
    // 说明文字
    const description = document.createElement('div');
    description.className = 'dnd-description';
    description.innerHTML = `
      <p>自定义勿扰模式的行为，让专注更符合你的需求。</p>
      <p>开启勿扰模式：点击右上角 🔔 按钮或按 <strong>F</strong> 键</p>
    `;
    container.appendChild(description);
    
    
    // 消息设置
    const messageSection = this.createDNDSection('message');
    container.appendChild(messageSection);
    
    // 声音设置
    const soundSection = this.createDNDSection('sound');
    container.appendChild(soundSection);
    
    // 视觉设置
    const visualSection = this.createDNDSection('visual');
    container.appendChild(visualSection);
    
    // 底部按钮
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'settings-button-group';
    
    // 重置按钮
    const resetButton = document.createElement('button');
    resetButton.textContent = '🔄 恢复默认';
    resetButton.className = 'settings-button';
    resetButton.addEventListener('click', () => this.resetDNDToDefaults());
    buttonContainer.appendChild(resetButton);
    
    container.appendChild(buttonContainer);

    return container;
  }
  
  /**
   * 创建勿扰设置的一个分组
   */
  createDNDSection(sectionKey) {
    const config = this.dndConfigs[sectionKey];
    const section = document.createElement('div');
    section.className = 'dnd-section';
    
    // 分组标题
    const sectionTitle = document.createElement('h4');
    sectionTitle.textContent = config.title;
    sectionTitle.className = 'dnd-section-title';
    section.appendChild(sectionTitle);
    
    // 复选框选项
    config.options.forEach(option => {
      const optionEl = this.createDNDCheckbox(option);
      section.appendChild(optionEl);
    });
    
    // 滑块选项（如果有）
    if (config.sliders) {
      config.sliders.forEach(slider => {
        const sliderEl = this.createDNDSlider(slider);
        section.appendChild(sliderEl);
      });
    }
    
    return section;
  }
  
  /**
   * 创建勿扰复选框
   */
  createDNDCheckbox(option) {
    
    const container = document.createElement('div');
    container.className = 'dnd-checkbox-container';
    
    // 获取当前值
    const currentValue = this.getDNDSetting(option.id);

    
    // 复选框
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `dnd-${option.id}`;
    checkbox.className = 'dnd-checkbox';
    checkbox.checked = currentValue; // 🔧 使用当前实际值
    
    // ... 后续代码保持不变
    
    // 标签
    const label = document.createElement('label');
    label.htmlFor = `dnd-${option.id}`;
    label.className = 'dnd-checkbox-label';
    
    // 自定义复选框样式
    const customCheckbox = document.createElement('span');
    customCheckbox.className = 'custom-checkbox';
    
    const labelText = document.createElement('span');
    labelText.className = 'dnd-label-text';
    labelText.textContent = option.label;
    
    label.appendChild(customCheckbox);
    label.appendChild(labelText);
    
    // 描述
    const description = document.createElement('div');
    description.className = 'dnd-option-description';
    description.textContent = option.description;
    
    // 事件监听
    checkbox.addEventListener('change', (e) => {
      this.updateDNDSetting(option.id, e.target.checked);
    });
    
    container.appendChild(checkbox);
    container.appendChild(label);
    container.appendChild(description);
    
    return container;
  }
  
  /**
   * 创建勿扰滑块
   */
  createDNDSlider(slider) {
    const container = document.createElement('div');
    container.className = 'dnd-slider-container';
    
    // 🔧 修复：从 dndManager 获取当前实际值（而不是默认值）
    const currentValue = this.getDNDSetting(slider.id);
    
    
    // 标签和数值显示
    const labelRow = document.createElement('div');
    labelRow.className = 'dnd-slider-label';
    
    const label = document.createElement('span');
    label.textContent = `${slider.icon} ${slider.label}`;
    label.className = 'dnd-slider-label-text';
    
    const valueDisplay = document.createElement('span');
    valueDisplay.id = `dnd-value-${slider.id}`;
    valueDisplay.textContent = slider.format(currentValue); // 🔧 使用当前实际值
    valueDisplay.className = 'dnd-slider-value';
    
    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);
    container.appendChild(labelRow);
    
    // 滑块
    const input = document.createElement('input');
    input.type = 'range';
    input.id = `dnd-slider-${slider.id}`;
    input.className = 'dnd-slider';
    input.min = slider.min;
    input.max = slider.max;
    input.step = slider.step;
    input.value = currentValue; // 🔧 使用当前实际值
    
    // 实时更新
    input.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      valueDisplay.textContent = slider.format(value);
      this.updateDNDSetting(slider.id, value);
    });
    
    container.appendChild(input);
    
    // 描述
    const description = document.createElement('div');
    description.className = 'dnd-option-description';
    description.textContent = slider.description;
    container.appendChild(description);
    
    return container;
  }
  
  /**
   * 获取勿扰设置值
   */
  getDNDSetting(key) {

    
    // 优先从 dndManager 获取当前值
    if (this.scene.dndManager && this.scene.dndManager.settings) {
      const value = this.scene.dndManager.settings[key];
      

      // 如果值存在，返回它（包括 false）
      if (value !== undefined) {
        return value;
      }
    }
    
    // 如果 dndManager 不存在或设置未定义，返回默认值
    const allConfigs = [
      ...this.dndConfigs.message.options, 
      ...this.dndConfigs.sound.options, 
      ...this.dndConfigs.visual.options,
      ...(this.dndConfigs.visual.sliders || [])
    ];
    
    const config = allConfigs.find(c => c.id === key);
    const defaultValue = config ? config.default : false;
    
    console.log(`⚠️ [getDNDSetting] ${key} 未找到，使用默认值: ${defaultValue}`);
    
    return defaultValue;
  }
  
  /**
   * 更新勿扰设置值
   */
  updateDNDSetting(key, value) {
    if (this.scene.dndManager) {
      this.scene.dndManager.updateSetting(key, value);
      console.log(`🔕 勿扰设置已更新: ${key} = ${value}`);
    }
  }
  
  /**
   * 重置勿扰设置到默认值
   */
  resetDNDToDefaults() {
    console.log('🔄 重置勿扰设置到默认值');
    
    if (!this.scene.dndManager) return;
    
    // 重置所有设置
    Object.keys(this.scene.dndManager.defaultSettings).forEach(key => {
      const defaultValue = this.scene.dndManager.defaultSettings[key];
      this.scene.dndManager.updateSetting(key, defaultValue);
    });
    
    // 重新渲染勿扰设置页
    const oldContent = document.getElementById('dnd-tab');
    if (oldContent) {
      oldContent.remove();
    }
    
    this.dndContent = this.createDNDTab();
    
    // 如果当前在勿扰标签页，重新显示
    if (this.currentTab === 'dnd') {
      this.contentArea.innerHTML = '';
      this.contentArea.appendChild(this.dndContent);
      this.dndContent.style.display = 'block';
    }
    
    if (this.scene.notifications) {
      this.scene.notifications.success('已恢复勿扰默认设置', 2000);
    }
  }
  
  /**
   * 创建关于页
   */
  createAboutTab() {
    const container = document.createElement('div');
    container.className = 'settings-tab-content';
    container.id = 'about-tab';
    container.style.display = 'none';
    
    // 标题
    const title = document.createElement('h3');
    title.textContent = 'ℹ️ 关于';
    title.className = 'settings-section-title';
    container.appendChild(title);
    
    // 项目信息
    const content = document.createElement('div');
    content.className = 'about-content';
    content.innerHTML = `
      <div class="about-logo">📚</div>
      <h2 class="about-title">Digital Library</h2>
      <div class="about-version">版本 v1.0</div>
      
      <div class="about-section">
        <p>基于格拉斯哥大学图书馆的记忆，</p>
        <p>打造的 2.5D 像素风虚拟学习空间。</p>
      </div>
      
      <div class="about-section">
        <p>提供有温度的陪伴感，</p>
        <p>而不打扰专注。</p>
      </div>
      
      <div class="about-section">
        <h4>🛠️ 技术栈</h4>
        <p>Phaser 3 + Node.js + Socket.io</p>
      </div>
      
      <div class="about-footer">
        <p>© 2025 格拉斯哥大学</p>
      </div>
    `;
    
    container.appendChild(content);
    
    return container;
  }
  
  /**
   * 切换 Tab
   */
  switchTab(tabName) {
    if (this.currentTab === tabName) return;
    
    console.log(`🔄 切换到: ${tabName}`);
    
    this.currentTab = tabName;
    
    // 更新按钮状态
    this.soundTab.classList.remove('active');
    this.dndTab.classList.remove('active');
    this.aboutTab.classList.remove('active');
    
    // 🔧 清空内容区域
    this.contentArea.innerHTML = '';
    
    // 🔧 根据选择的标签，添加对应的内容
    if (tabName === 'sound') {
      this.soundTab.classList.add('active');
      this.contentArea.appendChild(this.soundContent);
      this.soundContent.style.display = 'block';
    } else if (tabName === 'dnd') {
      this.dndTab.classList.add('active');
      this.contentArea.appendChild(this.dndContent); // 🔧 添加到 DOM
      this.dndContent.style.display = 'block';
    } else if (tabName === 'about') {
      this.aboutTab.classList.add('active');
      this.contentArea.appendChild(this.aboutContent);
      this.aboutContent.style.display = 'block';
    }
  }
  
  /**
   * 更新音量
   */
  updateVolume(category, value) {
    if (this.scene.soundManager) {
      this.scene.soundManager.setVolume(category, value);
      console.log(`🔊 更新音量: ${category} = ${(value * 100).toFixed(0)}%`);
    }
  }
  
  /**
   * 切换静音
   */
  toggleMute() {
    if (this.scene.soundManager) {
      if (this.isMuted) {
        this.scene.soundManager.unmuteAll();
        this.muteButton.textContent = '🔇 静音';
        this.isMuted = false;
        console.log('🔊 取消静音');
      } else {
        this.scene.soundManager.muteAll();
        this.muteButton.textContent = '🔊 取消静音';
        this.isMuted = true;
        console.log('🔇 已静音');
      }
    }
  }
  
  /**
   * 重置到默认值
   */
  resetToDefaults() {
    console.log('🔄 重置到默认设置');
    
    this.volumeConfigs.forEach(config => {
      const slider = document.getElementById(`slider-${config.id}`);
      const valueDisplay = document.getElementById(`volume-value-${config.id}`);
      
      if (slider && valueDisplay) {
        const defaultPercent = Math.round(config.defaultValue * 100);
        slider.value = defaultPercent;
        valueDisplay.textContent = `${defaultPercent}%`;
        
        this.updateVolume(config.category, config.defaultValue);
      }
    });
    
    // 取消静音
    if (this.isMuted) {
      this.toggleMute();
    }
    
    if (this.scene.notifications) {
      this.scene.notifications.success('已恢复默认设置', 2000);
    }
  }
  
  /**
   * 显示面板
   */
  show() {
    if (this.isVisible) return;
    
    console.log('⚙️ 打开设置面板');
    
    this.isVisible = true;
    this.overlay.style.display = 'block';
    this.panel.style.display = 'block';
    
    // 淡入动画
    this.overlay.style.opacity = '0';
    this.panel.style.opacity = '0';
    this.panel.style.transform = 'translate(-50%, -45%)';
    
    requestAnimationFrame(() => {
      this.overlay.style.transition = 'opacity 0.3s ease';
      this.panel.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      
      this.overlay.style.opacity = '1';
      this.panel.style.opacity = '1';
      this.panel.style.transform = 'translate(-50%, -50%)';
    });
  }
  
  /**
   * 隐藏面板
   */
  hide() {
    if (!this.isVisible) return;
    
    console.log('⚙️ 关闭设置面板');
    
    this.isVisible = false;
    
    // 淡出动画
    this.overlay.style.opacity = '0';
    this.panel.style.opacity = '0';
    this.panel.style.transform = 'translate(-50%, -45%)';
    
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.panel.style.display = 'none';
    }, 300);
  }
  
  /**
   * 切换显示/隐藏
   */
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
  
  /**
   * 销毁
   */
  destroy() {
    if (this.overlay) {
      this.overlay.remove();
    }
    if (this.panel) {
      this.panel.remove();
    }
    console.log('🗑️ SettingsPanel 已销毁');
  }
}