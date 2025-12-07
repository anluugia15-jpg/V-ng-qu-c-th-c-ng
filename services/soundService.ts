
export type SFXType = 'buy' | 'feed' | 'catch';
export type BGMType = 'aquarium' | 'zoo'; // Farm uses Zoo bgm for now

class SoundService {
  private bgm: HTMLAudioElement | null = null;
  
  // URLs for sound assets (using mixkit previews for demo purposes)
  private sounds = {
    buy: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.m4a', // Coin/Success
    feed: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.m4a', // Crunch
    catch: 'https://assets.mixkit.co/active_storage/sfx/1107/1107-preview.m4a', // Splash
  };

  private music = {
    aquarium: 'https://assets.mixkit.co/music/preview/mixkit-deep-meditation-109.mp3', // Calm underwater
    zoo: 'https://assets.mixkit.co/music/preview/mixkit-forest-adventure-1146.mp3', // Forest nature
  };

  playSFX(type: SFXType) {
    try {
      const audio = new Audio(this.sounds[type]);
      audio.volume = 0.6;
      audio.play().catch(e => console.warn("SFX blocked:", e));
    } catch (e) {
      console.error("Error playing SFX", e);
    }
  }

  playBGM(type: BGMType) {
    // Stop current BGM if any
    this.stopBGM();

    try {
      this.bgm = new Audio(this.music[type]);
      this.bgm.loop = true;
      this.bgm.volume = 0.3; // Background music should be softer
      
      const playPromise = this.bgm.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn("BGM autoplay prevented by browser. Interaction required.", error);
        });
      }
    } catch (e) {
      console.error("Error playing BGM", e);
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
      this.bgm = null;
    }
  }
}

export const soundService = new SoundService();
