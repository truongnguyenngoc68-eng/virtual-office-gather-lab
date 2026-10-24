/**
 * CameraManager - Quản lý camera access giữa các tabs/browsers
 * Đảm bảo chỉ một tab có thể sử dụng camera tại một thời điểm
 */

interface CameraLock {
  tabId: string;
  timestamp: number;
  userId: string;
}

const STORAGE_KEY = 'camera_lock';
const LOCK_TIMEOUT = 10000; // 10 giây - sau đó lock tự động expire
const CHANNEL_NAME = 'camera_sync';

class CameraManager {
  private tabId: string;
  private channel: BroadcastChannel | null = null;
  private currentStream: MediaStream | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private userId: string = '';

  constructor() {
    // Tạo unique tab ID
    this.tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Khởi tạo BroadcastChannel nếu supported
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.setupChannelListeners();
    }

    // Cleanup khi tab đóng
    window.addEventListener('beforeunload', () => {
      this.releaseCameraLock();
    });

    // Cleanup khi tab hidden (user switch tab)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.currentStream) {
        console.log('📱 Tab hidden, considering releasing camera...');
        // Có thể release sau một khoảng thời gian
      }
    });
  }

  setUserId(userId: string) {
    this.userId = userId;
  }

  private setupChannelListeners() {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      const { type, tabId, userId } = event.data;

      console.log(`📡 Received message: ${type} from tab ${tabId}`);

      switch (type) {
        case 'camera_released':
          // Một tab khác đã release camera
          console.log(`✅ Camera released by tab ${tabId}`);
          break;
        
        case 'camera_acquired':
          // Một tab khác đã acquire camera
          if (tabId !== this.tabId) {
            console.log(`⚠️ Another tab ${tabId} acquired camera`);
          }
          break;

        case 'request_release':
          // Tab khác yêu cầu release camera
          if (this.hasActiveLock() && tabId !== this.tabId) {
            console.log(`📢 Tab ${tabId} requests camera release`);
          }
          break;
      }
    };
  }

  /**
   * Kiểm tra xem có tab nào đang giữ camera lock không
   */
  private getCurrentLock(): CameraLock | null {
    try {
      const lockStr = localStorage.getItem(STORAGE_KEY);
      if (!lockStr) return null;

      const lock: CameraLock = JSON.parse(lockStr);
      
      // Check nếu lock đã expired
      if (Date.now() - lock.timestamp > LOCK_TIMEOUT) {
        console.log('🕐 Camera lock expired, removing...');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      return lock;
    } catch (error) {
      console.error('Error reading camera lock:', error);
      return null;
    }
  }

  /**
   * Kiểm tra xem tab hiện tại có đang giữ lock không
   */
  private hasActiveLock(): boolean {
    const lock = this.getCurrentLock();
    return lock?.tabId === this.tabId;
  }

  /**
   * Thử acquire camera lock với atomic operation
   */
  async acquireCameraLock(): Promise<boolean> {
    const existingLock = this.getCurrentLock();

    // Nếu tab hiện tại đã có lock
    if (existingLock?.tabId === this.tabId) {
      console.log('✅ Tab already has camera lock');
      this.refreshLock();
      return true;
    }

    // Nếu có tab khác đang giữ lock
    if (existingLock) {
      console.log(`⏳ Camera is locked by tab ${existingLock.tabId} (user: ${existingLock.userId}), waiting...`);
      return false;
    }

    // Acquire lock với atomic check
    try {
      const lock: CameraLock = {
        tabId: this.tabId,
        timestamp: Date.now(),
        userId: this.userId,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(lock));
      
      // CRITICAL: Double check sau khi set - race condition protection
      // Nếu có 2 tabs cùng set, chỉ tab cuối cùng sẽ win
      await new Promise(resolve => setTimeout(resolve, 50)); // Wait 50ms
      
      const doubleCheckLock = this.getCurrentLock();
      if (doubleCheckLock?.tabId !== this.tabId) {
        console.warn(`❌ Lost race condition - another tab ${doubleCheckLock?.tabId} acquired lock`);
        return false;
      }
      
      // Broadcast to other tabs
      this.channel?.postMessage({
        type: 'camera_acquired',
        tabId: this.tabId,
        userId: this.userId,
      });

      console.log(`🔒 Acquired camera lock for tab ${this.tabId} (user: ${this.userId})`);

      // Start refresh interval
      this.startLockRefresh();

      return true;
    } catch (error) {
      console.error('Error acquiring camera lock:', error);
      return false;
    }
  }

  /**
   * Refresh lock để tránh expire
   */
  private refreshLock() {
    if (!this.hasActiveLock()) return;

    try {
      const lock: CameraLock = {
        tabId: this.tabId,
        timestamp: Date.now(),
        userId: this.userId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lock));
    } catch (error) {
      console.error('Error refreshing lock:', error);
    }
  }

  /**
   * Start interval để refresh lock
   */
  private startLockRefresh() {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      if (this.currentStream) {
        this.refreshLock();
      } else {
        // Không còn stream thì dừng refresh
        this.stopLockRefresh();
      }
    }, LOCK_TIMEOUT / 2); // Refresh ở giữa timeout period
  }

  /**
   * Stop lock refresh interval
   */
  private stopLockRefresh() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Release camera lock
   */
  releaseCameraLock() {
    if (!this.hasActiveLock()) return;

    try {
      localStorage.removeItem(STORAGE_KEY);
      
      // Broadcast to other tabs
      this.channel?.postMessage({
        type: 'camera_released',
        tabId: this.tabId,
        userId: this.userId,
      });

      console.log(`🔓 Released camera lock for tab ${this.tabId}`);

      this.stopLockRefresh();
    } catch (error) {
      console.error('Error releasing camera lock:', error);
    }
  }

  /**
   * Set current media stream
   */
  setStream(stream: MediaStream | null) {
    this.currentStream = stream;
    
    if (!stream) {
      this.releaseCameraLock();
    }
  }

  /**
   * Request camera từ tab khác release
   */
  requestCameraRelease() {
    this.channel?.postMessage({
      type: 'request_release',
      tabId: this.tabId,
      userId: this.userId,
    });
  }

  /**
   * Kiểm tra xem có thể lấy camera không
   */
  canAcquireCamera(): boolean {
    const lock = this.getCurrentLock();
    return !lock || lock.tabId === this.tabId;
  }

  /**
   * Get thông tin tab đang giữ camera
   */
  getCameraOwner(): { tabId: string; userId: string } | null {
    const lock = this.getCurrentLock();
    if (!lock) return null;
    
    return {
      tabId: lock.tabId,
      userId: lock.userId,
    };
  }

  /**
   * Cleanup
   */
  destroy() {
    this.releaseCameraLock();
    this.stopLockRefresh();
    this.channel?.close();
  }
}

// Export singleton instance
export const cameraManager = new CameraManager();
