# README

This is a monorepo for our Proof of Personhood (PoP) project on StarkNet.

If you are interested in contributing, visit our [CONTRIBUTING.md](https://github.com/zorro-project/zorro/blob/main/CONTRIBUTING.md).

Our website is found at [https://zorro.xyz/](https://zorro.xyz/), and you can join our community on [Discord](https://discord.gg/Caj283PtN4). To learn more about our mission and goals, check out our [whitepaper](https://hackmd.io/@zorro-project/zorro-whitepaper).

# Introduction to Proof of Personhood

### **Sybil attacks**

Many services and protocols suffer from attackers generating many accounts and using them to manipulate votes, extract resources, promulgate disinformation, etc. These are are known as [sybil attacks](https://en.wikipedia.org/wiki/Sybil_attack).

To secure themselves against sybil attacks, services would like to have evidence that each of their accounts is backed by a unique person acting under their own volition, i.e., to have some kind of *proof of personhood* for each account.

### **Why Proof of Personhood matters**

Proof of Personhood can enable critical societal infrastructure, for example:

- Democratic governance in DAOs
- Universal basic income
- Quadratic funding of public goods (e.g. Gitcoin)
- Fair airdrops
- Bot-resistant social media

Many DAOs want to govern themselves with the aid of proof of personhood, but they lack good options for doing so and instead rely on [coin voting](https://vitalik.ca/general/2021/08/16/voting3.html) which is plutocratic and [leads to all sorts of problems](https://www.coindesk.com/business/2021/11/11/curve-wars-heat-up-emergency-dao-invoked-after-clear-governance-attack/).

More broadly, there are many wonderful services that *don’t even exist* because their would-be creators know that they’d just be wrecked by sybils.

### **Common misconceptions**

### **CAPTCHAs**

Solving a CAPTCHA can prove that a user is a person, but it can’t prove that they’re a *unique* person (since one person could create many accounts and solve a CAPTCHA for each one). This means it can’t be used to e.g. protect a democratic vote. Proof of Personhood aims to offer the stronger guarantee that each account belongs to a unique person.

### **Identity**

Proving personhood does *not* require authenticating someone’s identity (official name, etc). Proving personhood only requires showing that someone is *a* unique person, not *which* person they are.