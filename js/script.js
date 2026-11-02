const roadPrev = document.querySelector('.race__road-layer--prev');
const roadNext = document.querySelector('.race__road-layer--next');
const zone = document.querySelector('.race__road');
const sidewalk = document.querySelector('.race__sidewalk');
const water = document.querySelector('.race__water');
const car = document.querySelector('.race__player');
const go = document.querySelector('.race__start');
const modal = document.querySelector('.race__modal-wrapper');
const modalEnd = document.querySelector('.race__title');
const scoreField = document.querySelector('.race__score');
const livesItems = document.querySelectorAll('.race__lives-item');


/* ========================================
   HELPERS
======================================== */

function getRandomNumber(max, min) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* ========================================
   PLAYER
======================================== */

const player = {

    speed: 3,
    roadX:0,
    nitro: 0,
    sceneX: 0,
    roadPrevX: 0,
    roadNextX: 0,
    roadX: 0,
    playerX: 100,
    playerY: 250,
    sidewalkX:0,
    waterX:0,
    lives: 3,

    // Неуязвимость до определённого момента времени
    invulnerableUntil: 0,

    move: function () {

        /* ========================================
           ГРАНИЦЫ ПО X
        ======================================== */
    
        if (this.playerX >= 800) {
            this.playerX = 800;
    
        } else if (this.playerX <= 50) {
            this.playerX = 50;
        }
    
        /* ========================================
           ГРАНИЦЫ ПО Y
        ======================================== */
    
        if (this.playerY <= 50) {
            this.playerY = 50;
    
        } else if (this.playerY >= 480) {
            this.playerY = 480;
        }
    
        /* ========================================
           ПОЗИЦИЯ ИГРОКА
        ======================================== */
    
        car.style.left = `${this.playerX}px`;
        car.style.top = `${this.playerY}px`;
    
        /* ========================================
           СКОРОСТЬ
        ======================================== */
    
        this.speed += this.nitro;
    
        if (this.speed >= 15) {
            this.speed = 15;
    
        } else if (this.speed <= 3) {
            this.speed = 3;
        }
    
        /* ========================================
           ДВИЖЕНИЕ СЦЕНЫ
        ======================================== */
    
        /*
            ROAD + SIDEWALK
    
            Двигаются с одинаковой скоростью,
            поскольку находятся рядом друг с другом.
        */
    
        this.sceneX -= this.speed;
    
        zone.style.backgroundPositionX =
            `${this.sceneX}px`;
    
        sidewalk.style.backgroundPositionX =
            `${this.sceneX}px`;
    
        /* ========================================
           ВОДА
        ======================================== */
    
        /*
            Вода движется медленнее дороги.
            Параллакс оставляем.
        */
    
        this.waterX -= this.speed * 0.55;
    
        water.style.backgroundPositionX =
            `${this.waterX}px`;
    }

}
/* ========================================
   GAME STATE
======================================== */

let enemies = [];

let score = 0;

let gameOver = false;

let enemySpawnInterval = null;

let animationId = null;


/* ========================================
   LIVES
======================================== */

function updateLives() {

    livesItems.forEach((item, index) => {

        if (index < player.lives) {
            item.classList.remove('is-lost');
        } else {
            item.classList.add('is-lost');
        }

    });
}


/* ========================================
   SCORE
======================================== */

function updateScore() {

    scoreField.textContent = `Счёт: ${score}`;
}


/* ========================================
   CREATE ENEMY
======================================== */

function createEnemy() {

    const enemy = {

        speed: getRandomNumber(8, 2),

        x: getRandomNumber(6000, 2200),
        y: getRandomNumber(480, 50),

        width: 60,

        height: 100,

        // Очень важно:
        // машина может дать очко только один раз
        scored: false,

        element: document.createElement('div')
    };


    const img = document.createElement('img');

    img.src = './images/enemy.png';


    enemy.element.classList.add('race__enemy');

    enemy.element.appendChild(img);


    enemy.element.style.left = `${enemy.x}px`;

    enemy.element.style.top = `${enemy.y}px`;


    zone.appendChild(enemy.element);


    enemies.push(enemy);
}


/* ========================================
   COLLISION
======================================== */

function checkCollision(enemy) {

    /*
        Если игрок сейчас неуязвим,
        столкновение игнорируем.
    */

    if (performance.now() < player.invulnerableUntil) {
        return false;
    }


    /*
        Получаем размеры игрока
    */

    const playerWidth = car.offsetWidth;

    const playerHeight = car.offsetHeight;


    /*
        Hitbox игрока.

        Уменьшаем его немного,
        чтобы столкновение ощущалось естественнее.
    */

    const playerPaddingX = 12;
    const playerPaddingY = 15;


    const playerLeft =
        player.playerX + playerPaddingX;

    const playerRight =
        player.playerX +
        playerWidth -
        playerPaddingX;

    const playerTop =
        player.playerY + playerPaddingY;

    const playerBottom =
        player.playerY +
        playerHeight -
        playerPaddingY;


    /*
        Hitbox противника
    */

    const enemyPaddingX = 8;
    const enemyPaddingY = 10;


    const enemyLeft =
        enemy.x + enemyPaddingX;

    const enemyRight =
        enemy.x +
        enemy.width -
        enemyPaddingX;

    const enemyTop =
        enemy.y + enemyPaddingY;

    const enemyBottom =
        enemy.y +
        enemy.height -
        enemyPaddingY;


    /*
        AABB collision

        Если прямоугольники пересекаются —
        произошло столкновение.
    */

    const collision =
        playerLeft < enemyRight &&
        playerRight > enemyLeft &&
        playerTop < enemyBottom &&
        playerBottom > enemyTop;


    if (!collision) {
        return false;
    }


    /* ========================================
       HIT
    ======================================== */

    player.lives--;

    updateLives();


    /*
        1 секунда неуязвимости
    */

    player.invulnerableUntil =
        performance.now() + 1000;


    /*
        Анимация повреждения
    */

    car.classList.add('is-hit');


    setTimeout(() => {
        car.classList.remove('is-hit');
    }, 1000);


    /*
        Удаляем машину,
        которая в нас врезалась
    */

    if (enemy.element.parentNode) {
        enemy.element.remove();
    }


    enemies = enemies.filter(item => item !== enemy);


    /*
        Если жизни закончились —
        Game Over
    */

    if (player.lives <= 0) {
        endGame();
    }


    return true;
}


/* ========================================
   KEYBOARD
======================================== */

const keys = {};


document.addEventListener('keydown', (e) => {

    keys[e.key] = true;

});


document.addEventListener('keyup', (e) => {

    keys[e.key] = false;


    if (
        e.key === 'ArrowRight' ||
        e.key === 'ArrowLeft'
    ) {
        player.nitro = 0;
    }


    if (
        e.key === 'ArrowUp' ||
        e.key === 'ArrowDown'
    ) {
        car.style.transform = 'rotate(0deg)';
    }

});


/* ========================================
   UPDATE GAME
======================================== */

function update() {

    if (gameOver) {
        return;
    }


    /* ========================================
       PLAYER MOVEMENT
    ======================================== */

    if (keys['ArrowRight']) {

        player.nitro = 0.2;

        player.playerX += 5;
    }


    if (keys['ArrowLeft']) {

        player.nitro = -0.2;

        player.playerX -= 5;
    }
    if (keys['ArrowUp']) {

        player.playerY -= 15;

        car.style.transform =
            player.playerY <= 50
                ? 'rotate(0deg)'
                : 'rotate(-40deg)';
    }


    if (keys['ArrowDown']) {

        player.playerY += 15;

        car.style.transform =
            player.playerY >= 480
                ? 'rotate(0deg)'
                : 'rotate(40deg)';
    }


    /* ========================================
       PLAYER
    ======================================== */

    player.move();


    /* ========================================
       ENEMIES
    ======================================== */

    enemies.forEach(enemy => {

        /*
            Движение противника
        */

        enemy.x -= enemy.speed + player.speed;


        enemy.element.style.left =
            `${enemy.x}px`;


        enemy.element.style.top =
            `${enemy.y}px`;


        /*
            Проверяем столкновение
        */

        checkCollision(enemy);


        /*
            Начисляем очко только один раз
        */

        if (
            enemy.x <= player.playerX &&
            !enemy.scored
        ) {

            enemy.scored = true;

            score++;

            updateScore();
        }


        /*
            Удаляем машину,
            если она ушла за экран
        */

        if (enemy.x <= -400) {

            if (enemy.element.parentNode) {
                enemy.element.remove();
            }

            enemies =
                enemies.filter(item => item !== enemy);
        }

    });


    /* ========================================
       NEXT FRAME
    ======================================== */

    animationId =
        requestAnimationFrame(update);
}


/* ========================================
   START GAME
======================================== */

function startGame() {

    /*
        Сбрасываем игру
    */

    score = 0;

    gameOver = false;

    player.lives = 3;

    player.collisions = 0;

    player.invulnerableUntil = 0;


    /*
        Возвращаем игрока
    */

    player.playerX = 100;
    player.playerY = 250;


    car.style.opacity = '1';

    car.classList.remove('is-hit');


    /*
        Сбрасываем интерфейс
    */

    updateScore();

    updateLives();


    /*
        Удаляем старых врагов
    */

    enemies.forEach(enemy => {

        if (enemy.element.parentNode) {
            enemy.element.remove();
        }

    });


    enemies = [];


    /*
        Запускаем игровой цикл
    */

    animationId =
        requestAnimationFrame(update);


    /*
        Создание врагов
    */

    enemySpawnInterval =
        setInterval(() => {

            if (!gameOver) {
                createEnemy();
            }

        }, getRandomNumber(3000, 6000));
}


/* ========================================
   GAME OVER
======================================== */

function endGame() {

    gameOver = true;


    /*
        Останавливаем animation loop
    */

    if (animationId) {

        cancelAnimationFrame(animationId);

        animationId = null;
    }


    /*
        Останавливаем создание врагов
    */

    if (enemySpawnInterval) {

        clearInterval(enemySpawnInterval);

        enemySpawnInterval = null;
    }


    /*
        Удаляем всех врагов
    */

    enemies.forEach(enemy => {

        if (enemy.element.parentNode) {
            enemy.element.remove();
        }

    });


    enemies = [];


    /*
        Показываем Game Over
    */

    modal.classList.remove('hidden');

    modalEnd.textContent =
        `Счёт ${score}`;
}


/* ========================================
   START BUTTON
======================================== */

go.addEventListener('click', () => {

    startGame();

    modal.classList.add('hidden');

});