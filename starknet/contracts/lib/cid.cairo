%lang starknet

from starkware.cairo.common.math import assert_not_zero

# ipfs cid
struct Cid:
    member low : felt
    member high : felt
end

func assert_cid_is_zero(cid : Cid):
    assert cid.low = 0
    assert cid.high = 0
    return ()
end

func assert_cid_is_not_zero(cid : Cid):
    if cid.low == 0:
        assert_not_zero(cid.high)
    end
    if cid.high == 0:
        assert_not_zero(cid.low)
    end
    return ()
end
