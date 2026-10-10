import "@stdlib/deploy";

message(0x4f50454e) OpenMatch {
    matchId: Int as uint256;
    host: Address;
    stake: Int as coins;
    rakeBps: Int as uint16;
}

message(0x47534554) SetGuest {
    matchId: Int as uint256;
    guest: Address;
}

message(0x4445504f) Deposit {
    matchId: Int as uint256;
}

message(0x53544c45) Settle {
    matchId: Int as uint256;
    outcome: Int as uint8;
}

message(0x52464e44) Refund {
    matchId: Int as uint256;
}

message(0x52464e31) RefundOne {
    matchId: Int as uint256;
    who: Address;
}

struct MatchData {
    exists: Bool;
    host: Address;
    guest: Address;
    stake: Int as coins;
    rakeBps: Int as uint16;
    hostPaid: Bool;
    guestPaid: Bool;
    settled: Bool;
}

contract DotWarsEscrow with Deployable {
    oracle: Address;
    treasury: Address;
    matches: map<Int as uint256, MatchData>;

    init(oracle: Address, treasury: Address) {
        self.oracle = oracle;
        self.treasury = treasury;
    }

    fun zero(): Address {
        return newAddress(0, 0);
    }

    fun emptyMatch(): MatchData {
        return MatchData{
            exists: false,
            host: self.zero(),
            guest: self.zero(),
            stake: 0,
            rakeBps: 0,
            hostPaid: false,
            guestPaid: false,
            settled: false,
        };
    }

    fun load(id: Int): MatchData {
        let found = self.matches.get(id);
        if (found == null) {
            return self.emptyMatch();
        }
        return found!!;
    }

    fun pay(to: Address, amount: Int) {
        if (amount <= 0) {
            return;
        }
        send(SendParameters{
            to: to,
            value: amount,
            bounce: false,
            mode: SendIgnoreErrors,
        });
    }

    receive(msg: OpenMatch) {
        require(sender() == self.oracle, "oracle");
        require(msg.stake > 0, "stake");
        require(msg.rakeBps <= 2000, "rake");
        let current = self.load(msg.matchId);
        require(!current.exists || current.settled, "open");
        self.matches.set(msg.matchId, MatchData{
            exists: true,
            host: msg.host,
            guest: self.zero(),
            stake: msg.stake,
            rakeBps: msg.rakeBps,
            hostPaid: false,
            guestPaid: false,
            settled: false,
        });
    }

    receive(msg: SetGuest) {
        require(sender() == self.oracle, "oracle");
        let current = self.load(msg.matchId);
        require(current.exists && !current.settled, "match");
        require(!current.guestPaid, "paid");
        require(current.guest == self.zero() || current.guest == msg.guest, "guest");
        current.guest = msg.guest;
        self.matches.set(msg.matchId, current);
    }

    receive(msg: Deposit) {
        let current = self.load(msg.matchId);
        require(current.exists && !current.settled, "match");
        require(context().value >= current.stake, "value");
        if (sender() == current.host) {
            require(!current.hostPaid, "host");
            current.hostPaid = true;
        } else {
            require(!current.guestPaid, "guest");
            if (current.guest == self.zero()) {
                current.guest = sender();
            } else {
                require(sender() == current.guest, "guest");
            }
            current.guestPaid = true;
        }
        self.matches.set(msg.matchId, current);
    }

    receive(msg: Settle) {
        require(sender() == self.oracle, "oracle");
        let current = self.load(msg.matchId);
        require(current.exists && !current.settled, "match");
        require(current.hostPaid && current.guestPaid, "lock");
        require(msg.outcome <= 2, "outcome");
        current.settled = true;
        self.matches.set(msg.matchId, current);
        let pot: Int = current.stake * 2;
        let rake: Int = pot * current.rakeBps / 10000;
        let prize: Int = pot - rake;
        if (msg.outcome == 0) {
            self.pay(current.host, current.stake);
            self.pay(current.guest, current.stake);
            return;
        }
        if (msg.outcome == 1) {
            self.pay(current.host, prize);
        } else {
            self.pay(current.guest, prize);
        }
        self.pay(self.treasury, rake);
    }

    receive(msg: Refund) {
        let current = self.load(msg.matchId);
        require(current.exists && !current.settled, "match");
        require(!(current.hostPaid && current.guestPaid), "locked");
        let who: Address = sender();
        require(who == self.oracle || who == current.host || who == current.guest, "auth");
        if (current.hostPaid) {
            self.pay(current.host, current.stake);
        }
        if (current.guestPaid) {
            self.pay(current.guest, current.stake);
        }
        current.hostPaid = false;
        current.guestPaid = false;
        current.settled = true;
        self.matches.set(msg.matchId, current);
    }

    receive(msg: RefundOne) {
        require(sender() == self.oracle, "oracle");
        let current = self.load(msg.matchId);
        require(current.exists && !current.settled, "match");
        require(!(current.hostPaid && current.guestPaid), "locked");
        if (msg.who == current.host && current.hostPaid) {
            self.pay(current.host, current.stake);
            current.hostPaid = false;
        } else if (current.guest != self.zero() && msg.who == current.guest && current.guestPaid) {
            self.pay(current.guest, current.stake);
            current.guestPaid = false;
            current.guest = self.zero();
        }
        self.matches.set(msg.matchId, current);
    }

    get fun matchInfo(id: Int): MatchData {
        return self.load(id);
    }

    get fun oracle(): Address {
        return self.oracle;
    }

    get fun treasury(): Address {
        return self.treasury;
    }
}
