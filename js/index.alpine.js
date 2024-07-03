window.App = () => {
    return {

        expandicon: `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 cursor-pointer" viewBox="0 -960 960 960" fill="currentColor"><path d="M200-200v-240h80v160h160v80H200Zm480-320v-160H520v-80h240v240h-80Z"/></svg>
        `,
        collapseicon: `
        <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 cursor-pointer" viewBox="0 -960 960 960" fill="currentColor"><path d="M440-440v240h-80v-160H200v-80h240Zm160-320v160h160v80H520v-240h80Z"/></svg>
        `,


        hexstring:Alpine.$persist(''),
        chararray(){
            const assignments = this.hexstring.match(/.{1,2}/g).map(x => x.length == 2 ? x : x+'0').map((x, i) =>  '0x'+ x.toUpperCase());
            //const contentLength = Math.ceil( this.hexstring.length / 2)
            //const emptyString = " ".repeat(contentLength);
            return `
            char content[] = { ${assignments.join(',')} };
            int length = ${assignments.length};
            
            `

        },

        ConfigurationSettingCommandNames: ["1", "0", "0", "b1", "b0", "d2", "d1", "d0", "x3", "x2", "x1", "x0", "ms", "m2", "m1", "m0"],
        ConfigurationSettingCommand: Alpine.$persist([...Array(16)].map((x, i) => 0x8080 >> i & 1).reverse()),
        ConfigurationSettingCommandHex() {
            return "0x" + this.ConfigurationSettingCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(4, "0")
        },
        ConfigurationSettingCommandClick(index) {
            if (index > 2) {
                this.ConfigurationSettingCommand[index] = 1 - this.ConfigurationSettingCommand[index]
            }
            this.ConfigurationSettingCommand[0] = 1
            this.ConfigurationSettingCommand[1] = 0
            this.ConfigurationSettingCommand[2] = 0
        },
        FrequencyBand() {
            switch (this.ConfigurationSettingCommand[3] * 2 + this.ConfigurationSettingCommand[4] * 1) {
                case 1: return 433
                case 2: return 868
                case 3: return 915
                default: return NaN
            }
        },
        ClockOutputFrequency() {
            switch (this.ConfigurationSettingCommand[5] * 4 + this.ConfigurationSettingCommand[6] * 2 + this.ConfigurationSettingCommand[7] * 1) {
                case 0: return 1
                case 1: return 1.25
                case 2: return 1.66
                case 3: return 2
                case 4: return 2.5
                case 5: return 3.33
                case 6: return 5
                case 7: return 10
                default: return NaN
            }
        },
        CrystalLoadCapacitance() {
            const mp = this.ConfigurationSettingCommand.slice(8,12).reduce((a,b) => a*2+b*1)
            const rt = mp*0.5 + 8.5
            return rt
        },
        MS(){
            return this.ConfigurationSettingCommand[12]
        },
        DeviationFsk(fsk){ // fsk \in {0,1}
            const SIGN = this.MS() ^ fsk
            const M = this.ConfigurationSettingCommand.slice(13).reduce((a,b) => a*2+b*1)
            if(0 <= M  && M <= 6){
                return - (SIGN == 1? -1: 1) * (M+1) * 30
            } 
            return NaN
        },


        PowerManagementCommandNames: ["1", "1", "0", "0", "0", "0", "0", "0", "a1", "a0", "ex", "es", "ea", "eb", "et", "dc"],
        PowerManagementCommand: Alpine.$persist([...Array(16)].map((x, i) => 0xC000 >> i & 1).reverse()),
        PowerManagementCommandHex() {
            return "0x" + this.PowerManagementCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(4, "0")
        },
        PowerManagementCommandClick(index) {
            if (index > 7) {
                this.PowerManagementCommand[index] = 1 - this.PowerManagementCommand[index]
            }
            this.PowerManagementCommand[0] = 1
            this.PowerManagementCommand[1] = 1
            this.PowerManagementCommand[2] = 0
            this.PowerManagementCommand[3] = 0
            this.PowerManagementCommand[4] = 0
            this.PowerManagementCommand[5] = 0
            this.PowerManagementCommand[6] = 0
            this.PowerManagementCommand[7] = 0
        },
        warnIII() {
            return this.PowerManagementCommand[8] == 1
                && (
                    this.PowerManagementCommand[10] == 1 ||
                    this.PowerManagementCommand[11] == 1 ||
                    this.PowerManagementCommand[12] == 1
                )
        },


        FrequencySettingCommandNames: ["1", "0", "1", "0", "f11", "f10", "f9", "f8", "f7", "f6", "f5", "f4", "f3", "f2", "f1", "f0"],
        FrequencySettingCommand: Alpine.$persist([...Array(16)].map((x, i) => 0xA7D0 >> i & 1).reverse()),
        FrequencySettingCommandHex() {
            return "0x" + this.FrequencySettingCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(4, "0")
        },
        FrequencySettingCommandClick(index) {
            if (index > 2) {
                this.FrequencySettingCommand[index] = 1 - this.FrequencySettingCommand[index]
            }
            this.FrequencySettingCommand[0] = 1
            this.FrequencySettingCommand[1] = 0
            this.FrequencySettingCommand[2] = 1
            this.FrequencySettingCommand[3] = 0
        },
        FrequencySettingCommandFZero() {
            var C1 = 0;
            var C2 = 0;
            switch (this.FrequencyBand()) {
                case 433:
                    C1 = 1;
                    C2 = 43;
                    break;
                case 868:
                    C1 = 2;
                    C2 = 43;
                    break;
                case 915:
                    C1 = 3;
                    C2 = 30;
                    break;

                default:
                    return NaN


            }

            const F = this.FrequencySettingCommand.slice(4).reduce((a, b) => a * 2 + b * 1, 0)

            if (96 <= F && F <= 3903) {
                return 10.0 * C1 * (C2 + F / 4000)
            }
            return NaN

        },


        DataRateCommandNames: ["1", "1", "0", "0", "1", "0", "0", "0", "r7", "r6", "r5", "r4", "r3", "r2", "r1", "r0"],
        DataRateCommand: Alpine.$persist([...Array(16)].map((x, i) => 0xC800 >> i & 1).reverse()),
        DataRateCommandHex() {
            return "0x" + this.DataRateCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(4, "0")
        },
        DataRateCommandClick(index) {
            if (index > 7) {
                this.DataRateCommand[index] = 1 - this.DataRateCommand[index]
            }
            this.DataRateCommand[0] = 1
            this.DataRateCommand[1] = 1
            this.DataRateCommand[2] = 0
            this.DataRateCommand[3] = 0
            this.DataRateCommand[4] = 1
            this.DataRateCommand[5] = 0
            this.DataRateCommand[6] = 0
            this.DataRateCommand[7] = 0
        },
        BaudRate() {
            const R = this.DataRateCommand.slice(8).reduce((a, b) => a * 2 + b * 1, 0)
            return Math.round(10 * (10000.0 / 29.0 / (R + 1) + 0.5)) / 10.0;
        },


        PowerSettingCommandNames: ["1", "0", "1", "1", "0", "p2", "p1", "p0"],
        PowerSettingCommand: Alpine.$persist([...Array(8)].map((x, i) => 0xB0 >> i & 1).reverse()),
        PowerSettingCommandHex() {
            return "0x" + this.PowerSettingCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(2, "0")
        },
        PowerSettingCommandClick(index) {
            if (index > 4) {
                this.PowerSettingCommand[index] = 1 - this.PowerSettingCommand[index]
            }
            this.PowerSettingCommand[0] = 1
            this.PowerSettingCommand[1] = 0
            this.PowerSettingCommand[2] = 1
            this.PowerSettingCommand[3] = 1
            this.PowerSettingCommand[4] = 0
        },
        OutputPower() {
            const v = this.PowerSettingCommand.slice(5).reduce((a, b) => a * 2 + b * 1, 0)
            return - 3 * v
        },



        LowBatTxBitSyncCommandNames: ["1", "1", "0", "0", "0", "0", "1", "0", "dwc", "0", "ebs", "t4", "t3", "t2", "t1", "t0"],
        LowBatTxBitSyncCommand: Alpine.$persist([...Array(16)].map((x, i) => 0xC200 >> i & 1).reverse()),
        LowBatTxBitSyncCommandHex() {
            return "0x" + this.LowBatTxBitSyncCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(4, "0")
        },
        LowBatTxBitSyncCommandClick(index) {
            if (index > 7) {
                this.LowBatTxBitSyncCommand[index] = 1 - this.LowBatTxBitSyncCommand[index]
            }
            this.LowBatTxBitSyncCommand[0] = 1
            this.LowBatTxBitSyncCommand[1] = 1
            this.LowBatTxBitSyncCommand[2] = 0
            this.LowBatTxBitSyncCommand[3] = 0
            this.LowBatTxBitSyncCommand[4] = 0
            this.LowBatTxBitSyncCommand[5] = 0
            this.LowBatTxBitSyncCommand[6] = 1
            this.LowBatTxBitSyncCommand[7] = 0
            this.LowBatTxBitSyncCommand[9] = 0
        },
        V_LB(){
            const t = this.LowBatTxBitSyncCommand.slice(11).reduce((a, b) => a * 2 + b * 1, 0)
            return (2.2 + t/10.0)
        },


        

        SleepCommandNames: ["1", "1", "0", "0", "0", "1", "0", "0", "s7", "s6", "s5", "s4", "s3", "s2", "s1", "s0"],
        SleepCommand: Alpine.$persist([...Array(16)].map((x, i) => 0xC400 >> i & 1).reverse()),
        SleepCommandHex() {
            return "0x" + this.SleepCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(4, "0")
        },
        SleepCommandClick(index) {
            if (index > 7) {
                this.SleepCommand[index] = 1 - this.SleepCommand[index]
            }
            this.SleepCommand[0] = 1
            this.SleepCommand[1] = 1
            this.SleepCommand[2] = 0
            this.SleepCommand[3] = 0
            this.SleepCommand[4] = 0
            this.SleepCommand[5] = 1
            this.SleepCommand[6] = 0
            this.SleepCommand[7] = 0
        },
        SleepAfterCycles(){
            return this.SleepCommand.slice(8).reduce((a, b) => a * 2 + b * 1, 0)
        },


        

        WakeUpTimerCommandNames: ["1", "1", "1", "r4", "r3", "r2", "r1", "r0", "m7", "m6", "m5", "m4", "m3", "m2", "m1", "m0"],
        WakeUpTimerCommand: Alpine.$persist([...Array(16)].map((x, i) => 0xE000 >> i & 1).reverse()),
        WakeUpTimerCommandHex() {
            return "0x" + this.WakeUpTimerCommand.reduce((a, b) => a * 2 + b * 1, 0).toString(16).toUpperCase().padStart(4, "0")
        },
        WakeUpTimerCommandClick(index) {
            if (index > 2) {
                this.WakeUpTimerCommand[index] = 1 - this.WakeUpTimerCommand[index]
            }
            this.WakeUpTimerCommand[0] = 1
            this.WakeUpTimerCommand[1] = 1
            this.WakeUpTimerCommand[2] = 1
        },
        WakeUpTimerPeriod(){
            const M = this.WakeUpTimerCommand.slice(8).reduce((a, b) => a * 2 + b * 1, 0)
            const R = this.WakeUpTimerCommand.slice(3, 8).reduce((a, b) => a * 2 + b * 1, 0)
            
            if(R<31){
                return M * (1 << R)
            }
            if(R==31){
                return M * (1 << 30) * 2.0
            }
        },




    }
}