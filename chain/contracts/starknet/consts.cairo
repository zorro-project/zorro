namespace consts:
    const SUBMISSION_DEPOSIT_SIZE = 40
    const CHALLENGE_DEPOSIT_SIZE = 5
    const CHALLENGE_REWARD_SIZE = 40

    # Profiles challenged while still provision are presumed to be invalid; those challenged after are presumed valid
    const PROVISIONAL_PERIOD = 9 * 24 * 60 * 60  # 9 days

    # The amount of time the adjudicator has to act after a profile is challenged
    const ADJUDICATION_PERIOD = 6 * 24 * 60 * 60  # 6 days

    # The amount of time someone has to initiate an appeal after a profile is adjudicated (or not adjudicated due to timeout)
    const APPEAL_PERIOD = 3 * 24 * 60 * 60  # 3 days

    # the amount of time the super adjudicator has to act after a profile is appealed
    # XXX: estimate this correctly: log2(num kleros jurors) * max_time_per_round
    # Alternatively, we could send an L1->L2 message each appeal round, which would extend the window
    const SUPER_ADJUDICATION_PERIOD = 30 * 24 * 60 * 60  # 30 days
end
