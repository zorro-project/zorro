# README

This is a monorepo for our Proof of Personhood (PoP) project on StarkNet.

If you are interested in contributing, visit our [CONTRIBUTING.md](https://github.com/zorro-project/zorro/blob/main/CONTRIBUTING.md).

Our website is found at [https://zorro.xyz/](https://zorro.xyz/), and you can join our community on [Discord](https://discord.gg/Caj283PtN4). To learn more about our mission and goals, check out our [whitepaper](https://hackmd.io/@zorro-project/zorro-whitepaper).

# Introduction to Proof of Personhood

## **Sybil attacks**

Many services and protocols suffer from attackers generating many accounts and using them to manipulate votes, extract resources, promulgate disinformation, etc. These are are known as [sybil attacks](https://en.wikipedia.org/wiki/Sybil_attack).

To secure themselves against sybil attacks, services would like to have evidence that each of their accounts is backed by a unique person acting under their own volition, i.e., to have some kind of *proof of personhood* for each account.

## The Zorro Protocol

### Purpose

To date, there hasn't been broad adoption of proof of personhood. This is a loss because proof of personhood allows protocols and services to center more on *people* — on their preferences, their needs, their perspectives.

One reason for lackluster adoption of proof of personhood is that many existing solutions are quite demanding, requiring some e.g. a multi-day wait periods, significant funds, attendance of scheduled events, pre-existing connections, or technical knowledge. Protocols and services are reluctant to require such hoops because they anticipate that many people won't be willing (or able) to jump through them.

Zorro is an experiment to see if making proof of personhood fast (<5 minutes) and cheap (free) will lead to more adoption. The aim is to increase adoption of proof of personhood quickly, while web3 norms, governance, and culture are still developing. Hopefully, giving naescent institutions the tools they need to focus on people will result in those institutions being more prosocial. If protocols can't count people, people won't count!


### Design goals

Registering on Zorro should be:

#### Frictionless:
- **Free:** for people without much money
- **Fast:** for people without much time
- **Intuitive:** for people who aren't that technical

#### Inclusive:
- **Accessible:** to people who speak any language, have a speech disorder, etc
- **Non-discriminatory:** not biased by ethnicity, gender, etc
- **Pseudonymous:** for people that don't want to be publicly known

#### Trustworthy:
- **Robust:** sybil attacks should be expensive
- **Legible:** it should be clear how things work
- **Auditable:** decisions should be visible
- **Available:** difficult to halt or censor
- **Decentralized:** power should be distributed
- **Forkable:** in case the project goes awry

In practice, these various goals conflict and it's necessary to make tradeoffs. Zorro's intent is to occupy a pragmatic and pareto-efficient point in the space of possible designs.

To learn more about our roadmap and current implementation, view our [whitepaper](https://hackmd.io/@zorro-project/zorro-whitepaper).