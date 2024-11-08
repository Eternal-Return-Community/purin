const SteamUser = require('steam-user');
const fs = require('node:fs');

function loadAccount() {

    if (!fs.existsSync('./config.json')) {
        exit('[ERROR] -> Arquivo config.json não foi encontrado.')
    }

    return JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf-8', flag: 'r' }));
}

class ERBS {

    #token;
    #patch;
    #coupons = ['NEWPLAYERBOOST']

    #errors = {
        1006: 'ERBS entrou em manutenção.',
        1007: 'Versão do patch no arquivo config.json está desatualizado.'
    }

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

        const data = await response.json();

        if (this.#errors[data.cod]) exit(`[Server Error] -> ${this.#errors[data.cod]}`)

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

        this.#token = response.sessionKey;
    }

    async #account() {
        const response = await this.#client('GET', '/lobby/enterRepeat/?supportLanguage=2&searchTime=0')

        if (response?.user?.lv >= 21) {
            exit('[INFO] -> Sua conta já está no nível 21+. Use uma nova conta para poder usar o script.')
        }
    }

    async #tutorial() {
        for (let i = 0; i < 13; i++) {

            const key = i + 1;
            if (key == 9 || key == 10) continue;

            await this.#client('POST', '/users/tutorial/result', key)
        }
        console.log('[SUCESSO] -> Tutorial finalizado! \nRecompensas: 3 Personagens: Yuki, Hyejin e Eva, 51.680 A-coin, 7 Dias de Boost de XP, 3 Chaves, 2 Skin Data Box e 2 Research Center Data Box.\n')
        await this.#useCoupons();
    }

    async #useCoupons() {
        for (const coupon of this.#coupons) {
            await this.#client('POST', '/coupon/use', coupon)
        }
        console.log('[SUCESSO] -> Cupons utlizados com sucesso! \nRecompensas: 5.000 A-coin')
    }

    async #leveling() {
        await this.#tutorial()
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

            if (response?.userLevel === 21) {
                console.log('[SUCESSO] -> Leveling finalizado! Level atual da conta: 21')
                exit('[INFO] -> O script está sendo finalizado.')
            }
        }
    }

    async start() {
        await this.#account()

        console.log('[INFO] -> Inicilizado. Aguarde alguns minutos até que o processado seja finalizado.')
        
        await this.#leveling();
    }
}

class Steam extends SteamUser {

    #accountName;
    #password;
    #patch

    constructor({ login, password, patch } = account) {
        super({ autoRelogin: true })

        if (!login || !password || !patch) {
            exit('[ERROR] -> Faltando login, password ou versão do patch no arquivo config.json')
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
                    exit('[ERROR] -> Você precisa logar no jogo pelo menos uma vez na sua conta da Steam/ERBS.')
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
