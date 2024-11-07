Criei esse projetinho super rápido, provavelmente tem alguns bugs.<br>
Altere o `config.example.json` para `config.json` e adicione seu `login e senha` da `STEAM`. Não esqueça de adicionar a versão do `PATCH ATUAL`

# O Que que esse Script faz?
* Upa sua conta do lvl 1 ao 21 sem precisar logar no jogo. (Logue apenas uma vez para criar o token da conta.)
* Realiza todos os tutoriais novos e antigos do ERBS.
* No final sua conta vai receber essas recompensas: `3 Personagens: Yuki, Hyejin e Eva, 56.680 A-coin, 7 Dias de Boost de XP, 3 Chaves, 2 Skin Data Box e 2 Research Center Data Box.`

# Tratamento de Errors
* O metodo `account, tutorial e leveling` sempre vão retornar `200` indepedente se a conta já estiver nível `21` ou não. A mesma coisa para o `tutorial`, mesmo que a conta já tenha feito todos os `tutorías` concluidos o servidor da `NN` vai retornar `200` com uma string vazia.
* O metodo `useCoupon` retorna um erro de código `7200 até 7209`. O erro acontece ao utilizar um `cupom` que já foi usado, expirado ou cupom especial de determinada região.
