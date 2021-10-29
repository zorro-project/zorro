%lang starknet

from starkware.cairo.common.cairo_builtins import BitwiseBuiltin
from starkware.cairo.common.math import assert_not_zero
from starkware.cairo.common.bitwise import bitwise_or

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

func assert_cid_is_not_zero{bitwise_ptr : BitwiseBuiltin*}(cid : Cid):
    # Could implement this using conditionals, but then caller would refs
    let (union) = bitwise_or(cid.low, cid.high)
    assert_not_zero(union)
    return ()
end
