
function formatTime(seconds) 
{
    let hours = Math.floor(seconds / 3600);
    let minutes = Math.floor((seconds % 3600) / 60);
    seconds = seconds % 60;

    // 將小於10的數字轉換為兩位數
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    //return hours + ':' + minutes + ':' + seconds;
    return minutes + ':' + seconds;
}

class Ctrl
{
    constructor()
    {
        const current = this;
        this._page = new $(`
            <div class="page-ctrl">
                <div class="type">
                    <select name="type">
                        <option value="跳躍">跳躍</option>
                        <option value="休息">休息</option>  
                    </select>
                    <select name="mode">
                        <option value="60">60/分</option>
                        <option value="70">70/分</option>
                        <option value="80">80/分</option>
                        <option value="混合">混合</option>
                    </select>
                    <sub name="delta">60</sub>
                </div>
                <hr>
                
                <div class="time">
                    <i class="bi bi-dash-circle btn" style="font-size:2rem"></i>    
                    <label name="time" style="font-size:3rem">00:00</label>
                    <i class="bi bi-plus-circle btn" style="font-size:2rem"></i>
                </div>
                <hr>
                <div class="ctrl">
                    <i class="bi bi-pause-circle btn"></i>
                    <i class="bi bi-play-circle btn"></i>
                    <i class="bi bi-stop-circle btn"></i>
                </div>
            </div>
        `);
        this._page.appendTo(document.body);
        this._page.hide();
        this._type = this._page.find('select[name="type"]').on('change',(e)=>{this.change(e);});
        this._lb_delta = this._page.find('sub[name="delta"]').click(()=>{this.delta();});
        this._lb_time = this._page.find('label[name="time"]');
        
        this._mode = this._page.find('select[name="mode"]').on('change',(e)=>{this.mode(e);});

        this._page.find('.bi-dash-circle').click(()=>{this.minus();});
        this._page.find('.bi-plus-circle').click(()=>{this.plus();});

        this._btn_pause = this._page.find('.bi-pause-circle').click(()=>{this.pause()});
        this._btn_pause.hide();
        this._btn_play = this._page.find('.bi-play-circle').click(()=>{this.play()});
        this._page.find('.bi-stop-circle').click(()=>{this.stop()});
        this._remain;
        this._timer;
        this._counter;
        this._data;
        this._interval=1000;
        this._d=60;
        this._beep = new Audio('static/stop-13692.mp3');
        this._click = new Audio('static/start-13691.mp3');
        this._skip = false;
        this._tony = ['阿屎別摸魚','阿屎跳高一點'];
        this._abbie = ['阿皮跳快一點','阿皮跳高一點'];
        this._talk = ['像跳繩一樣，快速跳','正常跳','剩最後一分鐘了，跳快一點'];
        this._fast, this._normal;
    }

    sfxBeep() {this._beep.play();}
    sfxClick() {this._click.play();}

    // edit
    change(e)
    {
        this._data.type = e.target.value;
        this.update(this._data);
        this.sfxClick();
    }

    mode(e)
    {
        this._data.mode = e.target.value;
        this.setSpeed();
        this.update(this._data);
        this.sfxClick();
    }

    delta()
    {
        switch(this._d)
        {
            case 1: this._d = 30; break;
            case 30: this._d = 60; break;
            case 60: this._d = 1; break;
        }
        this._lb_delta.text(this.fmt(this._d));
        this.sfxClick();
    }

    fmt(delta)
    {
        return delta < 10 ? '0' + delta : delta;
    }

    plus()
    {
        let d = this._d;
        this._data.sec += d; 
        this._remain = this._data.sec;
        this._lb_time.text(formatTime(this._data.sec)); 
        this.update(this._data);
        this.sfxClick();
    }

    minus()
    {
        let d = this._d;
        this._data.sec = Math.max(this._data.sec-d,0); 
        this._remain = this._data.sec;
        this._lb_time.text(formatTime(this._data.sec)); 
        this.update(this._data);
        this.sfxClick();
    }

    async update()
    {
        await schePut(this._data);
        Schedule.update(this._data);
    }

    // ctrl
    speak()
    {
        let type = this._data.type;
        let [min,sec] = formatTime(this._remain).split(':').map((x)=>parseInt(x));
        let time = "";
        if(min){time += min+(sec?'分':'分鐘');} 
        if(sec){time += sec<10&&min>0 ? '0'+sec+'秒':sec+'秒';}; 
        Utility.speak(type+time);
    }

    updateCounter()
    {
        if((this._data.sec-this._remain)%120===0)
        {
            this._fast = this._remain;
            this._normal = this._remain - 60;
            // console.log(this._remain,this._fast, this._normal);
        }
    }

    setMode(mode)
    {
        this._data.speed = mode===0 ? 100 
                                    : mode===1 ? 60 
                                                : 100;
        this.startCounter();
        Utility.speak(this._talk[mode]);
    }

    setSpeed()
    {
        switch(this._data.mode)
        {
            case '60': this._data.speed=60; break;
            case '70': this._data.speed=70; break;
            case '80': this._data.speed=80; break;
            case '混合': this._data.speed=100; break;
        }
    }

    startTimer()
    {
        this._timer = setInterval(async()=>{
            
            if(this._data.type == '跳躍' && this._data.mode == '混合')
            {
                this.updateCounter();
                console.log(this._remain,this._fast, this._normal);
                if(this._remain === 60) {this.setMode(2);}
                else if(this._remain === this._fast) {this.setMode(0);}
                else if(this._remain === this._normal) {this.setMode(1);}
            }

            this._remain--;
            this._lb_time.text(formatTime(this._remain));

            if(this._remain <= 0)
            {
                this.stopInterval()
                if(this._data.type == '休息')
                {
                    Utility.speak('休息時間到');
                    await delay(2);
                }
                Schedule.next();
            }
        },1000);
    }

    startCounter()
    {
        this._interval = 1000*60/this._data.speed;
        clearInterval(this._counter);
        this._counter = setInterval(()=>{
            if(this._data.type == '跳躍') {this.sfxBeep();}
        },this._interval);
    }

    async play()
    {
        if(this._skip) {return}
        this.sfxClick();
        this._skip = true;

        this.speak();
        this._btn_pause.show();
        this._btn_play.hide();
        await delay(1);

        if(this._remain <= 0)
        {
            Schedule.next();
            return;
        }
        
        this.startCounter();
        this.startTimer();
        
        this._skip = false;
    }

    pause()
    {
        if(this._skip) {return}
        this.sfxClick();

        this._btn_pause.hide();
        this._btn_play.show();
        this.stopInterval();
        Utility.speak('暫停');
    }

    stop()
    {
        if(this._skip) {return}
        this.sfxClick();

        this.stopInterval();
        this.hide();
        Schedule.stop();
        Utility.speak('停止');
    }

    stopInterval()
    {
        clearInterval(this._timer);
        clearInterval(this._counter);
    }

    async show(data, play=false)
    {
        this._skip = false;
        this._page.show();

        this.stopInterval();

        this._btn_pause.hide();
        this._btn_play.show();

        this._data = data;
        this._remain = data.sec;
        this._type.val(data.type);
        this._lb_time.text(formatTime(data.sec));
        this._mode.val(data.mode);
        this.setSpeed();
        if(play){this.play();}
    }

    hide()
    {
        this._page.hide();
        this.stopInterval();
    }

    static hide()
    {
        if(!Ctrl.instance){return;}
        Ctrl.instance.hide();
    }

    static show(data, play=false)
    {
        if(!Ctrl.instance){Ctrl.instance = new Ctrl();}
        Ctrl.instance.show(data, play);
    }
}


class Schedule
{
    static instance;
    constructor()
    {
        const current = this;
        this._page = new $(`
            <div class="page-schedule">
                <div style="text-align:center">排程</div>
                <hr>
                <div class="list">
                </div>
            </div>
        `);
        this._page.appendTo(document.body);
        this._page.hide();
        this._page.find('.card-btn-close').click(()=>{this.hide()});
        this._list = this._page.find('.list');
        this._sche;
        this._idx;
        this._selected;
        this._click = new Audio('static/start-13691.mp3');
    }

    sfxClick() {this._click.play().catch(()=>{});}

    btn_add()
    {
        let group = new $(`<div style="text-align:center"><i class="bi bi-plus-lg btn"></i></div>`);
        group.find('.btn').click(async()=>{
            let data = {type:'跳躍', speed:60, sec:0};
            await schePut(data);
            this.show_items();
            Ctrl.hide();
        });

        this._list.append(group);
        this.sfxClick();
    }


    add_item(data)
    {
        let item = $(`
            <div class="item">
                <label style="user-select: none; pointer-events: none;">${data.type}</label>
                <label style="user-select: none; pointer-events: none;">${formatTime(data.sec)}</label>
                <i class="bi bi-x-lg btn"></i>
            </div>
        `);
        this._list.append(item);
        item.click((e)=>{this.select_item($(e.target),data)});
        item.find('.btn').click((e)=>{this.delete(e,data)});
    }

    select_item(target, data)
    {
        //console.log(data);
        this.sfxClick();

        if(this.select(target))
        {
            this._idx = this._sche.indexOf(data);
            Ctrl.show(data);
        }
        else
        {
            Ctrl.hide();
        }

    }

    async delete(e, data)
    {
        e.stopPropagation();
        await scheDelete(data);
        this.show_items();
        Ctrl.hide();
        this.sfxClick();
    }

    update(data)
    {
        this._selected.find('label').eq(0).text(data.type);
        this._selected.find('label').eq(1).text(formatTime(data.sec));
    }

    stop()
    {
        if(this._selected){this._selected.css('background-color','');}
        this._selected.removeAttr('seleted');
        this._selected = null;
    }

    async show_items()
    {
        this._sche = await scheGetAll();
        this._list.empty();
        this._sche.map((data)=>{ 
            this.add_item(data);
        });
        this.btn_add();

    }

    async next()
    {
         this._idx++;
         this.unselect();
         if(this._idx < this._sche.length)
         {
            this.select(this._list.children().eq(this._idx));
            Ctrl.show(this._sche[this._idx], true);
            // Scroll the item into the center of the view
            this._selected[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
         else
         {
            Utility.speak('結束');
            await delay(1);
            Ctrl.hide();
         }
    }

    unselect()
    {
        if(this._selected)
        {
            this._selected.css('background-color','');
            this._selected.removeAttr('seleted');
            this._selected = null;
        }
    }

    select(target)
    {
        if(target.attr('seleted'))
        {
            this.unselect();
            return false;
        }
        else if(this._selected)
        {
            this.unselect();
        }
        
        this._selected = target;
        this._selected.css('background-color','lightgreen');
        this._selected.attr('seleted',true);
        return true;
        
    }

    async show()
    {
        this._page.show();
        this._sche = await scheGetAll();
        console.log(this._sche);
        this.show_items();
    }

    hide()
    {
        this._page.hide();
    }

    static stop()
    {
        if(!Schedule.instance){return;}
        Schedule.instance.stop();
        
    }

    static update(data)
    {
        if(!Schedule.instance){return;}
        Schedule.instance.update(data);
    }

    static next()
    {
        if(!Schedule.instance){return;}
        Schedule.instance.next();
    }

    static show()
    {
        if(!Schedule.instance){Schedule.instance = new Schedule();}
        Schedule.instance.show();
    }
    

}