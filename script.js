console.log('JavaScript');

let currentSong = new Audio();
let songs = [];
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

async function getSongs(folder) {
    currFolder = folder;

    let a = await fetch(`/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");

    songs = [];
    for (let element of as) {
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songlist ul");
    if (!songUL) {
        console.error("Missing .songlist <ul> in HTML!");
        return;
    }

    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `
            <li>
                <img class="invert" width="34" src="pic/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div>Harry</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="pic/play.svg" alt="">
                </div>
            </li>`;
    }

    Array.from(songUL.getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "pic/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums...");
    let a = await fetch(`/songs/`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".card-container");

    for (let e of anchors) {
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0];

            try {
                let a = await fetch(`/songs/${folder}/info.json`);
                let data = await a.json();

                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="48" height="48">
                            <circle cx="12" cy="12" r="12" fill="#1DB954" />
                            <polygon points="9,7 18,12 9,17" fill="white" />
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="cover" />
                    <h2>${data.title}</h2>
                    <p>${data.description}</p>
                </div>`;
            } catch (err) {
                console.warn(`Could not load info.json for ${folder}`);
            }
        }
    }

    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching Songs...");
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    await getSongs("songs/chill"); 
    playMusic(songs[0], true);
    await displayAlbums();

    // Play / Pause 
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pic/pause.svg";
        } else {
            currentSong.pause();
            play.src = "pic/play.svg";
        }
    });

    //Update seekbar
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar click
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    // Hamburger 
    document.querySelector(".hamberger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    //Sidebar close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    
    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index - 1 >= 0) playMusic(songs[index - 1]);
    });

    
    next.addEventListener("click", () => {
        currentSong.pause();
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if (index + 1 < songs.length) playMusic(songs[index + 1]);
    });

    //Volume slider
    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = "pic/volume.svg";
        }
    });

    // For Mute toggle
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("pic/volume.svg")) {
            e.target.src = "pic/mute.svg";
            currentSong.volume = 0;
            document.querySelector(".range input").value = 0;
        } else {
            e.target.src = "pic/volume.svg";
            currentSong.volume = 0.1;
            document.querySelector(".range input").value = 10;
        }
    });
}

main();
