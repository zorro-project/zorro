func assert_is_boolean(x : felt):
    # x == 0 || x == 1
    assert ((x - 1) * x) = 0
    return ()
end

func get_is_equal(a : felt, b : felt) -> (res : felt):
    if a == b:
        return (1)
    else:
        return (0)
    end
end

func invert(x : felt) -> (res : felt):
    if x == 1:
        return (0)
    else:
        assert x = 0
        return (1)
    end
end
