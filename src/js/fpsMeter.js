class FpsMeter {
    constructor() {
        this.timeSpan = 1000;
        this.mileStone = 0;
        this.framesSinceMileStone = 0;
        this.fps = 0;
    }

    getFps() {
        return this.fps;
    }

    invoke() {
        const time = new Date().getTime();
        const diff = time - this.mileStone;
        if (diff < this.timeSpan) {
            this.framesSinceMileStone++;
        } else {
            this.mileStone = time;
            this.fps = Math.floor(this.framesSinceMileStone / diff * 1000);
            this.framesSinceMileStone = 0;
        }
    }
}