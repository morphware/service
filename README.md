# Morphware: Service

---

### Notes copied over from `JobFactory.sol`

/*
    Early stopping    - Vickrey Auction, using the SimpleAuction contract?
    Active monitoring - Micropayment channel?
*/

/* 
    `rewardSchedule` is currently thought to be either a:
    - continuous reward (TBA: worker is rewarded essentially for descending the gradient)
    - variable reward (Early Stopping; kind-of a Boolean pay-off structure: as workers will
        only be rewarded if they have reached a threshold-level of accuracy)
    - fixed interval reward (Active Monitoring)
    - fixed ratio reward (for validators(?); as they will verify a certain number of models
        over a period of time: even if the selection process for them is pseudo-random?)
    ...encoded as a `string` or a series of `bytes`
*/

/* 
    Implement a form of a reputation score that basically updates how off 
    a given `endUser`'s estimation is of their workload's training time 
*/

---
