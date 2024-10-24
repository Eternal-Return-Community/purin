const SteamUser = require('steam-user');
const fs = require('node:fs');

function loadAccount() {
    const config = fs.readFileSync('./config.json', { encoding: 'utf-8', flag: 'r' })
    return JSON.parse(config);
}

class ERBS {

    #token;
    #patch;

    constructor(patch) {
        this.#patch = patch;
    }

    async #client(method, endpoint, body) {
        const response = await fetch('https://bser-rest-release.bser.io/api'.concat(endpoint), {
            method,
            headers: {
                'User-Agent': 'BestHTTP/2 v2.4.0',
                'Content-Type': 'application/json',
                'X-BSER-SessionKey': this.#token,
                'X-BSER-Version': this.#patch,
                'X-BSER-AuthProvider': 'STEAM',
                'Host': 'bser-rest-release.bser.io',
            },
            body
        })

        const data = await response.json()

        if (data.cod !== 200) {

            if (data.msg === 'maintenance') {
                exit('ERBS atualmente está em manutenção.')
            }

            exit(data.msg)
        }

        return data.rst;
    }

    async auth(authorizationCode) {
        const response = await this.#client('POST', '/users/authenticate', JSON.stringify({
            "dlc": "pt",
            "glc": "ko",
            "alc": "en",
            "la": 2,
            "ap": 'STEAM',
            "idt": authorizationCode,
            "prm": { authorizationCode },
            "ver": this.#patch
        }))

        if (response === 'INVALID_VERSION') {
            exit(`Versão do patch do config.json está desatualizada.`)
        }

        this.#token = response.sessionKey;
    }

    async #account() {
        const response = await this.#client('GET', '/lobby/enterRepeat/?supportLanguage=2&searchTime=0')

        if (response?.user.lv >= 21) {
            exit('Sua conta já está no nível 21+. Use uma conta nova para pode usar o script.')
        }
    }

    async #tutorial() {
        for (let i = 0; i < 13; i++) {
            await this.#client('POST', '/users/tutorial/result', String(i + 1))
        }
        console.log('Recompensas: 3 Personagens: Yuki, Hyejin e Eva, 48.920 A-coin, 7 Dias de Boost de XP, 3 Chaves, 2 Skin Data Box e 2 Research Center Data Box.')
    }

    async #leveling() {
        while (true) {
            const response = await this.#client('PUT', '/battle/games/aiBattle', JSON.stringify({
                "clv": 20,
                "cn": 20,
                "dtm": 0,
                "dtp": 0,
                "kum": -1,
                "mir": {
                    "125": 1000,
                    "149": 1000,
                    "335": 1000
                },
                "mk": 100,
                "pk": 100,
                "rk": 1,
            }))

            if (response?.rst.userLevel === 21) {
                console.log(' -> Leveling finalizado! Level atual da conta: 21');
                break;
            }
        }
    }

    async start() {
        this.#account()
        this.#tutorial()
        this.#leveling()
    }
}

class Steam extends SteamUser {

    #accountName;
    #password;
    #patch

    constructor({ login, password, patch } = account) {
        super({ autoRelogin: true })

        if (!login || !password || !patch) {
            exit('Tá faltando login, password ou patch no arquivo config.json')
        }

        this.#accountName = login;
        this.#password = password;
        this.#patch = patch;

        this.#login()
    }

    #login() {
        this.logOn({ accountName: this.#accountName, password: this.#password })
        this.#getToken()
    }

    #getToken() {
        this.once('loggedOn', async () => {

            //1049590 - GAME ID (Eternal Return)
            await this.createAuthSessionTicket(1049590, async (err, sessionTicket) => {

                if (err) {
                    exit('Você precisa logar no jogo pelo menos uma vez. Quite assim que começar o Tutorial.')
                }

                const erbs = new ERBS(this.#patch);

                await erbs.auth(this.#getSessionTicket(sessionTicket))
                erbs.start()
            })
        })
    }

    #getSessionTicket(sessionTicket) {
        return sessionTicket.toString('hex').toUpperCase()
    }
}

function exit(message) {
    console.error(message)
    process.exit(0)
}

new Steam(loadAccount())