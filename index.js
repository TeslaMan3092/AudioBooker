    //vars
    let curentChapter;
    let curentChapterStr;
    let curentChapterBtn;
    let bookTitle;
    let numberOfChaps;
    let chapters;
    let curentTimes;
    let curentYTid;
    let timeInterval;
    let shouldUpdatePP = 1;
    
    const chapterButtons = document.getElementById('chapBtns');
    let jsonData;

    //youtube stuff
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    var player;

    function bookPickerWithBookItem(book){
        initWithBookJson(book.getAttribute('jsonURL'));
        hideElement(document.getElementById('bookPicker'));
        showElement(document.getElementById('bookLoadingIcon'));
    }

    function bookPickerWindowControlShow(show){
        if(show){
            showElement(document.getElementById('bookPickerWindow'));
        }else{
            hideElement(document.getElementById('bookPickerWindow'), function() {
                showElement(document.getElementById('bookPicker'));
                hideElement(document.getElementById('bookLoadingIcon'));
            });
        }
    }

    // some stack overflow answer
    function initWithBookJson(bookJsonUrl) {
        fetch(bookJsonUrl)
        .then(function (resp) {
            return resp.json();
        })
        .then(data => jsonData = data)
        .then(function (data) {
            console.log(data);
            afterLoadJson();
            bookPickerWindowControlShow(false);
            LoadInYouTubeEmbed();
        });
    }

    function afterLoadJson() {
        const chapterButtons = document.getElementById('chapBtns');
        bookTitle = jsonData.book.bookTitle;
        numberOfChaps = jsonData.book.chapterNum;
        chapters = jsonData.book.chapters;
        document.getElementById("chapContTitle").textContent = bookTitle;
        document.getElementById("chapContTitle").innerHTML = `${bookTitle}<br><span style="font-weight: normal; font-size: 20px;">By${jsonData.book.author}</span>`;
        document.getElementById("bgImg").src = jsonData.book.bgImage;
        // create the chapter buttons
        for (let i = 1; i < (numberOfChaps + 1); i++) {
            var chpter = document.createElement('div');
            chpter.classList.add("chapterButton");
            chpter.id = `chapter${i}btn`;
            chpter.setAttribute('onclick',  `playChapter("chapter${i}", this, 1)`);
            chpter.setAttribute('chapterNum',  `${i}`);
            chpter.innerHTML = `
                <div class="progressBar" id="chapter${i}ProgressBar"></div>
                <h3 class="prevent-select">${chapters['chapter' + i].customTitle}</h3>

            `;
            chapterButtons.appendChild(chpter);
            console.log(`added chapyter button`);
        }
        changeFavIconWithUrl(jsonData.book.coverIMG)
        // updateSiteTitle();
    }

    //update stuff
    function updateSiteTitle() {
        if(curentChapter == null || curentChapter == "") return;
        document.title = `${curentChapter.customTitle} - ${bookTitle} `;
    }
    //scroll to view
    function scrollIntoVew(div){
        div.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        })
    }
    //video stuff
    function LoadInYouTubeEmbed() {
        const lastPlayingChap = localStorage.getItem('lastPlayingChap' +  bookTitle)
        const lastPlayingTime = localStorage.getItem('lastPlayingTime'+ bookTitle)
        curentYTid = (lastPlayingChap != null) ? jsonData.book.chapters[lastPlayingChap].ytVidID : jsonData.book.chapters.chapter1.ytVidID
        curentChapterStr = (lastPlayingChap != null) ?  lastPlayingChap : 'chapter1'
        curentChapter = (lastPlayingChap != null) ? jsonData.book.chapters[lastPlayingChap] : jsonData.book.chapters.chapter1
        curentTimes = (lastPlayingChap != null) ? jsonData.book.chapters[lastPlayingChap].vidTiming : jsonData.book.chapters.chapter1.vidTiming
        curentChapterBtn = document.getElementById(`${curentChapterStr}btn`)

        player = new YT.Player('player', {
            height: '100%',
            width: '100%',
            videoId: curentYTid,
            playerVars: {
                'playsinline': 1,
                'startSeconds': curentTimes[0],
                'endSeconds': curentTimes[1]
            },
            events: {
                onStateChange: onPlayerStateChange
            }
        })

        if(lastPlayingChap == null) localStorage.setItem('lastPlayingChap'+ bookTitle, 'chapter1')
        if(lastPlayingTime == null) localStorage.setItem('lastPlayingTime' + bookTitle, jsonData.book.chapters.chapter1.vidTiming[0])
        if(lastPlayingChap != null){
            // setTimeout(function (){
                scrollIntoVew(document.getElementById(`${lastPlayingChap}btn`))
            // }, 5000)
            updateBtnHighlighting()
        }
        updateSiteTitle()
        createPopup(`Now playing ${curentChapter.customTitle}`)
    }

    function playChapter(chapterName, button, clickedToPlayChapter) {
        const oldChapter = curentChapter
        curentTimes = jsonData.book.chapters[chapterName].vidTiming
        curentChapter = jsonData.book.chapters[chapterName]
        curentChapterStr = chapterName
        curentChapterBtn = button
        localStorage.setItem('lastPlayingChap' + bookTitle, chapterName)
        if(oldChapter.ytVidID != curentChapter.ytVidID || clickedToPlayChapter){
            player.loadVideoById({'videoId': curentChapter.ytVidID,
            'startSeconds': curentTimes[0]})
        }else{
            if(curentTimes[0] != oldChapter.vidTiming[1]) player.seekTo(curentChapter.vidTiming[0], true)
        }
        
        updateSiteTitle()
        createPopup(`Now playing ${curentChapter.customTitle}`)
        updateBtnHighlighting()
        player.playVideo()
    }
    function playNextChapter(){
        let chapterNumber = parseInt(curentChapterStr.match(/\d+/)[0]) // GPT
        chapterNumber++
        curentChapterStr = curentChapterStr.replace(/\d+/, chapterNumber)
        playChapter(curentChapterStr, document.getElementById(`chapter${chapterNumber}btn`))
        scrollIntoVew(document.getElementById(`chapter${chapterNumber}btn`))
    }
    player.addEventListener('onEnded', function() {
        updateTimes()
        stopTimeUpdate()
    })

    // Video time suff
    function onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.PLAYING) {
            startTimeUpdate()
            // console.log("updating pasePlay for playing")
            //if(shouldUpdatePP == 1){  }else{ shouldUpdatePP = 1}
            if(shouldUpdatePP == 1){ pausePlay(0 ,0) }else{ shouldUpdatePP = 1}
        }else if(event.data === YT.PlayerState.PAUSED){
            // console.log("updating pasePlay for paused")
            if(shouldUpdatePP == 1){ pausePlay(1 ,0) }else{ shouldUpdatePP = 1}
            stopTimeUpdate()
            
        }
        updateTimes()
    }

    function startTimeUpdate(){
        clearInterval(timeInterval)
        timeInterval = setInterval(function () {
            console.log("updating times from timout")
            updateTimes()
            }, 600)
    }
    function stopTimeUpdate(){
        clearInterval(timeInterval)
    }

    function updateBtnHighlighting(){
        const progressDivs = document.querySelectorAll('.progressBar')

        progressDivs.forEach(div => {
            div.style.width = null
            div.parentNode.style.backgroundColor  = ((parseInt(div.parentNode.getAttribute('chapterNum'))) < parseInt(curentChapterBtn.getAttribute('chapterNum'))) ? 'rgba(0, 234, 0, 0.15)' : null 
        })
        document.getElementById(`${curentChapterStr}ProgressBar`).parentNode.style.background = 'rgba(255, 0, 0, 0.07)'
    }
    function updateTimes() {
        const currentTime = player.getCurrentTime()
        const progressBar = document.getElementById(`${curentChapterStr}ProgressBar`)
        const progress = (currentTime - curentChapter.vidTiming[0]) / (curentChapter.vidTiming[1] - curentChapter.vidTiming[0]) * 100
        console.log("updating times")
        // console.log("(currentTime - curentChapter.vidTiming[0]) : " + (currentTime - curentChapter.vidTiming[0]))
        // console.log("(curentChapter.vidTiming[1] - curentChapter.vidTiming[0])" + (curentChapter.vidTiming[1] - curentChapter.vidTiming[0]))
        const progressDivs = document.querySelectorAll('.progressBar')

        updateBtnHighlighting()
        progressBar.style.background = null
        progressBar.style.width = `${progress}%`
        if(currentTime > curentChapter.vidTiming[1] || currentTime == curentChapter.vidTiming[1]){ playNextChapter()}
        if(currentTime < curentChapter.vidTiming[0]) player.seekTo(curentChapter.vidTiming[0], true)
    }

    //media controls
    function pausePlay(a, b){
        const button = document.getElementById(`pausePlayBtn`)
        // console.log("pausePlayBtn " + a)
        shouldUpdatePP = 1
        if(b == 1){
            if(a == 1){ player.pauseVideo() }else{ player.playVideo() }
            shouldUpdatePP = 0
        }
        button.classList.add(a == 1 ? 'pause' : 'play')
        button.classList.remove(a == 1 ? 'play' : 'pause')
        button.setAttribute('onclick', a == 1 ? 'pausePlay(0 , 1)' : 'pausePlay(1 , 1)')
    }

    function skipSec(time, button){
        const currentTime = player.getCurrentTime()
        const newTime = (parseInt(time) + currentTime)
        player.seekTo(newTime, true)

        button.classList.add([parseInt(time) == -5 ? 'backwardRotate' : 'forwardRotate'])
        updateTimes()
        setTimeout(function(){
            button.classList.remove([parseInt(time) == -5 ? 'backwardRotate' : 'forwardRotate'])
        }, 300) 
    }

    function hideElement(element, customTimeoutCallBack){
        element.classList.remove('showAnimtion');
        element.classList.add('hideAnimtion');
        hideTimer = setTimeout(function(){
            element.style.display = 'none';
            if(customTimeoutCallBack) customTimeoutCallBack();
        }, 300)
        element.setAttribute('hideTimer', hideTimer);
    }
    function showElement(element){
        element.style.display = null;
        element.classList.remove('hideAnimtion');
        element.classList.add('showAnimtion');
        clearTimeout(element.getAttribute('hideTimer'));
    }

function createPopup(text) {
    const progressDivs = document.querySelectorAll('.popup')
    progressDivs.forEach(div => {
        div.style.opacity = '0'
    })
    let el = document.createElement('DIV')
    el.classList.add('popup')
    el.innerHTML = '<b text-aling: center>' + text + '</b>'
    document.body.appendChild(el)

    setTimeout(() => {
        el.style.opacity = '0'
        setTimeout(() => {
            el.remove()
        }, 450)
    }, 2000)
}

function changeFavIconWithUrl(url) {
    var link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = url;
}