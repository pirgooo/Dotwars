import {
    Cell,
    Slice,
    Address,
    Builder,
    beginCell,
    ComputeError,
    TupleItem,
    TupleReader,
    Dictionary,
    contractAddress,
    address,
    ContractProvider,
    Sender,
    Contract,
    ContractABI,
    ABIType,
    ABIGetter,
    ABIReceiver,
    TupleBuilder,
    DictionaryValue
} from '@ton/core';

export type DataSize = {
    $$type: 'DataSize';
    cells: bigint;
    bits: bigint;
    refs: bigint;
}

export function storeDataSize(src: DataSize) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.cells, 257);
        b_0.storeInt(src.bits, 257);
        b_0.storeInt(src.refs, 257);
    };
}

export function loadDataSize(slice: Slice) {
    const sc_0 = slice;
    const _cells = sc_0.loadIntBig(257);
    const _bits = sc_0.loadIntBig(257);
    const _refs = sc_0.loadIntBig(257);
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function loadGetterTupleDataSize(source: TupleReader) {
    const _cells = source.readBigNumber();
    const _bits = source.readBigNumber();
    const _refs = source.readBigNumber();
    return { $$type: 'DataSize' as const, cells: _cells, bits: _bits, refs: _refs };
}

export function storeTupleDataSize(source: DataSize) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.cells);
    builder.writeNumber(source.bits);
    builder.writeNumber(source.refs);
    return builder.build();
}

export function dictValueParserDataSize(): DictionaryValue<DataSize> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDataSize(src)).endCell());
        },
        parse: (src) => {
            return loadDataSize(src.loadRef().beginParse());
        }
    }
}

export type SignedBundle = {
    $$type: 'SignedBundle';
    signature: Buffer;
    signedData: Slice;
}

export function storeSignedBundle(src: SignedBundle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBuffer(src.signature);
        b_0.storeBuilder(src.signedData.asBuilder());
    };
}

export function loadSignedBundle(slice: Slice) {
    const sc_0 = slice;
    const _signature = sc_0.loadBuffer(64);
    const _signedData = sc_0;
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function loadGetterTupleSignedBundle(source: TupleReader) {
    const _signature = source.readBuffer();
    const _signedData = source.readCell().asSlice();
    return { $$type: 'SignedBundle' as const, signature: _signature, signedData: _signedData };
}

export function storeTupleSignedBundle(source: SignedBundle) {
    const builder = new TupleBuilder();
    builder.writeBuffer(source.signature);
    builder.writeSlice(source.signedData.asCell());
    return builder.build();
}

export function dictValueParserSignedBundle(): DictionaryValue<SignedBundle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSignedBundle(src)).endCell());
        },
        parse: (src) => {
            return loadSignedBundle(src.loadRef().beginParse());
        }
    }
}

export type StateInit = {
    $$type: 'StateInit';
    code: Cell;
    data: Cell;
}

export function storeStateInit(src: StateInit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeRef(src.code);
        b_0.storeRef(src.data);
    };
}

export function loadStateInit(slice: Slice) {
    const sc_0 = slice;
    const _code = sc_0.loadRef();
    const _data = sc_0.loadRef();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function loadGetterTupleStateInit(source: TupleReader) {
    const _code = source.readCell();
    const _data = source.readCell();
    return { $$type: 'StateInit' as const, code: _code, data: _data };
}

export function storeTupleStateInit(source: StateInit) {
    const builder = new TupleBuilder();
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    return builder.build();
}

export function dictValueParserStateInit(): DictionaryValue<StateInit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStateInit(src)).endCell());
        },
        parse: (src) => {
            return loadStateInit(src.loadRef().beginParse());
        }
    }
}

export type Context = {
    $$type: 'Context';
    bounceable: boolean;
    sender: Address;
    value: bigint;
    raw: Slice;
}

export function storeContext(src: Context) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.bounceable);
        b_0.storeAddress(src.sender);
        b_0.storeInt(src.value, 257);
        b_0.storeRef(src.raw.asCell());
    };
}

export function loadContext(slice: Slice) {
    const sc_0 = slice;
    const _bounceable = sc_0.loadBit();
    const _sender = sc_0.loadAddress();
    const _value = sc_0.loadIntBig(257);
    const _raw = sc_0.loadRef().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function loadGetterTupleContext(source: TupleReader) {
    const _bounceable = source.readBoolean();
    const _sender = source.readAddress();
    const _value = source.readBigNumber();
    const _raw = source.readCell().asSlice();
    return { $$type: 'Context' as const, bounceable: _bounceable, sender: _sender, value: _value, raw: _raw };
}

export function storeTupleContext(source: Context) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.bounceable);
    builder.writeAddress(source.sender);
    builder.writeNumber(source.value);
    builder.writeSlice(source.raw.asCell());
    return builder.build();
}

export function dictValueParserContext(): DictionaryValue<Context> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeContext(src)).endCell());
        },
        parse: (src) => {
            return loadContext(src.loadRef().beginParse());
        }
    }
}

export type SendParameters = {
    $$type: 'SendParameters';
    mode: bigint;
    body: Cell | null;
    code: Cell | null;
    data: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeSendParameters(src: SendParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        if (src.code !== null && src.code !== undefined) { b_0.storeBit(true).storeRef(src.code); } else { b_0.storeBit(false); }
        if (src.data !== null && src.data !== undefined) { b_0.storeBit(true).storeRef(src.data); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadSendParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _code = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _data = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleSendParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _code = source.readCellOpt();
    const _data = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'SendParameters' as const, mode: _mode, body: _body, code: _code, data: _data, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleSendParameters(source: SendParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeCell(source.code);
    builder.writeCell(source.data);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserSendParameters(): DictionaryValue<SendParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSendParameters(src)).endCell());
        },
        parse: (src) => {
            return loadSendParameters(src.loadRef().beginParse());
        }
    }
}

export type MessageParameters = {
    $$type: 'MessageParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    to: Address;
    bounce: boolean;
}

export function storeMessageParameters(src: MessageParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeAddress(src.to);
        b_0.storeBit(src.bounce);
    };
}

export function loadMessageParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _to = sc_0.loadAddress();
    const _bounce = sc_0.loadBit();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function loadGetterTupleMessageParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _to = source.readAddress();
    const _bounce = source.readBoolean();
    return { $$type: 'MessageParameters' as const, mode: _mode, body: _body, value: _value, to: _to, bounce: _bounce };
}

export function storeTupleMessageParameters(source: MessageParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeAddress(source.to);
    builder.writeBoolean(source.bounce);
    return builder.build();
}

export function dictValueParserMessageParameters(): DictionaryValue<MessageParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMessageParameters(src)).endCell());
        },
        parse: (src) => {
            return loadMessageParameters(src.loadRef().beginParse());
        }
    }
}

export type DeployParameters = {
    $$type: 'DeployParameters';
    mode: bigint;
    body: Cell | null;
    value: bigint;
    bounce: boolean;
    init: StateInit;
}

export function storeDeployParameters(src: DeployParameters) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.mode, 257);
        if (src.body !== null && src.body !== undefined) { b_0.storeBit(true).storeRef(src.body); } else { b_0.storeBit(false); }
        b_0.storeInt(src.value, 257);
        b_0.storeBit(src.bounce);
        b_0.store(storeStateInit(src.init));
    };
}

export function loadDeployParameters(slice: Slice) {
    const sc_0 = slice;
    const _mode = sc_0.loadIntBig(257);
    const _body = sc_0.loadBit() ? sc_0.loadRef() : null;
    const _value = sc_0.loadIntBig(257);
    const _bounce = sc_0.loadBit();
    const _init = loadStateInit(sc_0);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function loadGetterTupleDeployParameters(source: TupleReader) {
    const _mode = source.readBigNumber();
    const _body = source.readCellOpt();
    const _value = source.readBigNumber();
    const _bounce = source.readBoolean();
    const _init = loadGetterTupleStateInit(source);
    return { $$type: 'DeployParameters' as const, mode: _mode, body: _body, value: _value, bounce: _bounce, init: _init };
}

export function storeTupleDeployParameters(source: DeployParameters) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.mode);
    builder.writeCell(source.body);
    builder.writeNumber(source.value);
    builder.writeBoolean(source.bounce);
    builder.writeTuple(storeTupleStateInit(source.init));
    return builder.build();
}

export function dictValueParserDeployParameters(): DictionaryValue<DeployParameters> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployParameters(src)).endCell());
        },
        parse: (src) => {
            return loadDeployParameters(src.loadRef().beginParse());
        }
    }
}

export type StdAddress = {
    $$type: 'StdAddress';
    workchain: bigint;
    address: bigint;
}

export function storeStdAddress(src: StdAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 8);
        b_0.storeUint(src.address, 256);
    };
}

export function loadStdAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(8);
    const _address = sc_0.loadUintBig(256);
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleStdAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readBigNumber();
    return { $$type: 'StdAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleStdAddress(source: StdAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeNumber(source.address);
    return builder.build();
}

export function dictValueParserStdAddress(): DictionaryValue<StdAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeStdAddress(src)).endCell());
        },
        parse: (src) => {
            return loadStdAddress(src.loadRef().beginParse());
        }
    }
}

export type VarAddress = {
    $$type: 'VarAddress';
    workchain: bigint;
    address: Slice;
}

export function storeVarAddress(src: VarAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeInt(src.workchain, 32);
        b_0.storeRef(src.address.asCell());
    };
}

export function loadVarAddress(slice: Slice) {
    const sc_0 = slice;
    const _workchain = sc_0.loadIntBig(32);
    const _address = sc_0.loadRef().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function loadGetterTupleVarAddress(source: TupleReader) {
    const _workchain = source.readBigNumber();
    const _address = source.readCell().asSlice();
    return { $$type: 'VarAddress' as const, workchain: _workchain, address: _address };
}

export function storeTupleVarAddress(source: VarAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.workchain);
    builder.writeSlice(source.address.asCell());
    return builder.build();
}

export function dictValueParserVarAddress(): DictionaryValue<VarAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeVarAddress(src)).endCell());
        },
        parse: (src) => {
            return loadVarAddress(src.loadRef().beginParse());
        }
    }
}

export type BasechainAddress = {
    $$type: 'BasechainAddress';
    hash: bigint | null;
}

export function storeBasechainAddress(src: BasechainAddress) {
    return (builder: Builder) => {
        const b_0 = builder;
        if (src.hash !== null && src.hash !== undefined) { b_0.storeBit(true).storeInt(src.hash, 257); } else { b_0.storeBit(false); }
    };
}

export function loadBasechainAddress(slice: Slice) {
    const sc_0 = slice;
    const _hash = sc_0.loadBit() ? sc_0.loadIntBig(257) : null;
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function loadGetterTupleBasechainAddress(source: TupleReader) {
    const _hash = source.readBigNumberOpt();
    return { $$type: 'BasechainAddress' as const, hash: _hash };
}

export function storeTupleBasechainAddress(source: BasechainAddress) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.hash);
    return builder.build();
}

export function dictValueParserBasechainAddress(): DictionaryValue<BasechainAddress> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeBasechainAddress(src)).endCell());
        },
        parse: (src) => {
            return loadBasechainAddress(src.loadRef().beginParse());
        }
    }
}

export type Deploy = {
    $$type: 'Deploy';
    queryId: bigint;
}

export function storeDeploy(src: Deploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2490013878, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2490013878) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function loadGetterTupleDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'Deploy' as const, queryId: _queryId };
}

export function storeTupleDeploy(source: Deploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeploy(): DictionaryValue<Deploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadDeploy(src.loadRef().beginParse());
        }
    }
}

export type DeployOk = {
    $$type: 'DeployOk';
    queryId: bigint;
}

export function storeDeployOk(src: DeployOk) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(2952335191, 32);
        b_0.storeUint(src.queryId, 64);
    };
}

export function loadDeployOk(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 2952335191) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function loadGetterTupleDeployOk(source: TupleReader) {
    const _queryId = source.readBigNumber();
    return { $$type: 'DeployOk' as const, queryId: _queryId };
}

export function storeTupleDeployOk(source: DeployOk) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    return builder.build();
}

export function dictValueParserDeployOk(): DictionaryValue<DeployOk> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeployOk(src)).endCell());
        },
        parse: (src) => {
            return loadDeployOk(src.loadRef().beginParse());
        }
    }
}

export type FactoryDeploy = {
    $$type: 'FactoryDeploy';
    queryId: bigint;
    cashback: Address;
}

export function storeFactoryDeploy(src: FactoryDeploy) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1829761339, 32);
        b_0.storeUint(src.queryId, 64);
        b_0.storeAddress(src.cashback);
    };
}

export function loadFactoryDeploy(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1829761339) { throw Error('Invalid prefix'); }
    const _queryId = sc_0.loadUintBig(64);
    const _cashback = sc_0.loadAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function loadGetterTupleFactoryDeploy(source: TupleReader) {
    const _queryId = source.readBigNumber();
    const _cashback = source.readAddress();
    return { $$type: 'FactoryDeploy' as const, queryId: _queryId, cashback: _cashback };
}

export function storeTupleFactoryDeploy(source: FactoryDeploy) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.queryId);
    builder.writeAddress(source.cashback);
    return builder.build();
}

export function dictValueParserFactoryDeploy(): DictionaryValue<FactoryDeploy> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeFactoryDeploy(src)).endCell());
        },
        parse: (src) => {
            return loadFactoryDeploy(src.loadRef().beginParse());
        }
    }
}

export type OpenMatch = {
    $$type: 'OpenMatch';
    matchId: bigint;
    host: Address;
    stake: bigint;
    rakeBps: bigint;
}

export function storeOpenMatch(src: OpenMatch) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1330660686, 32);
        b_0.storeUint(src.matchId, 256);
        b_0.storeAddress(src.host);
        b_0.storeCoins(src.stake);
        b_0.storeUint(src.rakeBps, 16);
    };
}

export function loadOpenMatch(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1330660686) { throw Error('Invalid prefix'); }
    const _matchId = sc_0.loadUintBig(256);
    const _host = sc_0.loadAddress();
    const _stake = sc_0.loadCoins();
    const _rakeBps = sc_0.loadUintBig(16);
    return { $$type: 'OpenMatch' as const, matchId: _matchId, host: _host, stake: _stake, rakeBps: _rakeBps };
}

export function loadTupleOpenMatch(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _host = source.readAddress();
    const _stake = source.readBigNumber();
    const _rakeBps = source.readBigNumber();
    return { $$type: 'OpenMatch' as const, matchId: _matchId, host: _host, stake: _stake, rakeBps: _rakeBps };
}

export function loadGetterTupleOpenMatch(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _host = source.readAddress();
    const _stake = source.readBigNumber();
    const _rakeBps = source.readBigNumber();
    return { $$type: 'OpenMatch' as const, matchId: _matchId, host: _host, stake: _stake, rakeBps: _rakeBps };
}

export function storeTupleOpenMatch(source: OpenMatch) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.matchId);
    builder.writeAddress(source.host);
    builder.writeNumber(source.stake);
    builder.writeNumber(source.rakeBps);
    return builder.build();
}

export function dictValueParserOpenMatch(): DictionaryValue<OpenMatch> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeOpenMatch(src)).endCell());
        },
        parse: (src) => {
            return loadOpenMatch(src.loadRef().beginParse());
        }
    }
}

export type SetGuest = {
    $$type: 'SetGuest';
    matchId: bigint;
    guest: Address;
}

export function storeSetGuest(src: SetGuest) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1196639572, 32);
        b_0.storeUint(src.matchId, 256);
        b_0.storeAddress(src.guest);
    };
}

export function loadSetGuest(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1196639572) { throw Error('Invalid prefix'); }
    const _matchId = sc_0.loadUintBig(256);
    const _guest = sc_0.loadAddress();
    return { $$type: 'SetGuest' as const, matchId: _matchId, guest: _guest };
}

export function loadTupleSetGuest(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _guest = source.readAddress();
    return { $$type: 'SetGuest' as const, matchId: _matchId, guest: _guest };
}

export function loadGetterTupleSetGuest(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _guest = source.readAddress();
    return { $$type: 'SetGuest' as const, matchId: _matchId, guest: _guest };
}

export function storeTupleSetGuest(source: SetGuest) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.matchId);
    builder.writeAddress(source.guest);
    return builder.build();
}

export function dictValueParserSetGuest(): DictionaryValue<SetGuest> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSetGuest(src)).endCell());
        },
        parse: (src) => {
            return loadSetGuest(src.loadRef().beginParse());
        }
    }
}

export type Deposit = {
    $$type: 'Deposit';
    matchId: bigint;
}

export function storeDeposit(src: Deposit) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1145393231, 32);
        b_0.storeUint(src.matchId, 256);
    };
}

export function loadDeposit(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1145393231) { throw Error('Invalid prefix'); }
    const _matchId = sc_0.loadUintBig(256);
    return { $$type: 'Deposit' as const, matchId: _matchId };
}

export function loadTupleDeposit(source: TupleReader) {
    const _matchId = source.readBigNumber();
    return { $$type: 'Deposit' as const, matchId: _matchId };
}

export function loadGetterTupleDeposit(source: TupleReader) {
    const _matchId = source.readBigNumber();
    return { $$type: 'Deposit' as const, matchId: _matchId };
}

export function storeTupleDeposit(source: Deposit) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.matchId);
    return builder.build();
}

export function dictValueParserDeposit(): DictionaryValue<Deposit> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDeposit(src)).endCell());
        },
        parse: (src) => {
            return loadDeposit(src.loadRef().beginParse());
        }
    }
}

export type Settle = {
    $$type: 'Settle';
    matchId: bigint;
    outcome: bigint;
}

export function storeSettle(src: Settle) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1398033477, 32);
        b_0.storeUint(src.matchId, 256);
        b_0.storeUint(src.outcome, 8);
    };
}

export function loadSettle(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1398033477) { throw Error('Invalid prefix'); }
    const _matchId = sc_0.loadUintBig(256);
    const _outcome = sc_0.loadUintBig(8);
    return { $$type: 'Settle' as const, matchId: _matchId, outcome: _outcome };
}

export function loadTupleSettle(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _outcome = source.readBigNumber();
    return { $$type: 'Settle' as const, matchId: _matchId, outcome: _outcome };
}

export function loadGetterTupleSettle(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _outcome = source.readBigNumber();
    return { $$type: 'Settle' as const, matchId: _matchId, outcome: _outcome };
}

export function storeTupleSettle(source: Settle) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.matchId);
    builder.writeNumber(source.outcome);
    return builder.build();
}

export function dictValueParserSettle(): DictionaryValue<Settle> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeSettle(src)).endCell());
        },
        parse: (src) => {
            return loadSettle(src.loadRef().beginParse());
        }
    }
}

export type Refund = {
    $$type: 'Refund';
    matchId: bigint;
}

export function storeRefund(src: Refund) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1380339268, 32);
        b_0.storeUint(src.matchId, 256);
    };
}

export function loadRefund(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1380339268) { throw Error('Invalid prefix'); }
    const _matchId = sc_0.loadUintBig(256);
    return { $$type: 'Refund' as const, matchId: _matchId };
}

export function loadTupleRefund(source: TupleReader) {
    const _matchId = source.readBigNumber();
    return { $$type: 'Refund' as const, matchId: _matchId };
}

export function loadGetterTupleRefund(source: TupleReader) {
    const _matchId = source.readBigNumber();
    return { $$type: 'Refund' as const, matchId: _matchId };
}

export function storeTupleRefund(source: Refund) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.matchId);
    return builder.build();
}

export function dictValueParserRefund(): DictionaryValue<Refund> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRefund(src)).endCell());
        },
        parse: (src) => {
            return loadRefund(src.loadRef().beginParse());
        }
    }
}

export type RefundOne = {
    $$type: 'RefundOne';
    matchId: bigint;
    who: Address;
}

export function storeRefundOne(src: RefundOne) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeUint(1380339249, 32);
        b_0.storeUint(src.matchId, 256);
        b_0.storeAddress(src.who);
    };
}

export function loadRefundOne(slice: Slice) {
    const sc_0 = slice;
    if (sc_0.loadUint(32) !== 1380339249) { throw Error('Invalid prefix'); }
    const _matchId = sc_0.loadUintBig(256);
    const _who = sc_0.loadAddress();
    return { $$type: 'RefundOne' as const, matchId: _matchId, who: _who };
}

export function loadTupleRefundOne(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _who = source.readAddress();
    return { $$type: 'RefundOne' as const, matchId: _matchId, who: _who };
}

export function loadGetterTupleRefundOne(source: TupleReader) {
    const _matchId = source.readBigNumber();
    const _who = source.readAddress();
    return { $$type: 'RefundOne' as const, matchId: _matchId, who: _who };
}

export function storeTupleRefundOne(source: RefundOne) {
    const builder = new TupleBuilder();
    builder.writeNumber(source.matchId);
    builder.writeAddress(source.who);
    return builder.build();
}

export function dictValueParserRefundOne(): DictionaryValue<RefundOne> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeRefundOne(src)).endCell());
        },
        parse: (src) => {
            return loadRefundOne(src.loadRef().beginParse());
        }
    }
}

export type MatchData = {
    $$type: 'MatchData';
    exists: boolean;
    host: Address;
    guest: Address;
    stake: bigint;
    rakeBps: bigint;
    hostPaid: boolean;
    guestPaid: boolean;
    settled: boolean;
}

export function storeMatchData(src: MatchData) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeBit(src.exists);
        b_0.storeAddress(src.host);
        b_0.storeAddress(src.guest);
        b_0.storeCoins(src.stake);
        b_0.storeUint(src.rakeBps, 16);
        b_0.storeBit(src.hostPaid);
        b_0.storeBit(src.guestPaid);
        b_0.storeBit(src.settled);
    };
}

export function loadMatchData(slice: Slice) {
    const sc_0 = slice;
    const _exists = sc_0.loadBit();
    const _host = sc_0.loadAddress();
    const _guest = sc_0.loadAddress();
    const _stake = sc_0.loadCoins();
    const _rakeBps = sc_0.loadUintBig(16);
    const _hostPaid = sc_0.loadBit();
    const _guestPaid = sc_0.loadBit();
    const _settled = sc_0.loadBit();
    return { $$type: 'MatchData' as const, exists: _exists, host: _host, guest: _guest, stake: _stake, rakeBps: _rakeBps, hostPaid: _hostPaid, guestPaid: _guestPaid, settled: _settled };
}

export function loadTupleMatchData(source: TupleReader) {
    const _exists = source.readBoolean();
    const _host = source.readAddress();
    const _guest = source.readAddress();
    const _stake = source.readBigNumber();
    const _rakeBps = source.readBigNumber();
    const _hostPaid = source.readBoolean();
    const _guestPaid = source.readBoolean();
    const _settled = source.readBoolean();
    return { $$type: 'MatchData' as const, exists: _exists, host: _host, guest: _guest, stake: _stake, rakeBps: _rakeBps, hostPaid: _hostPaid, guestPaid: _guestPaid, settled: _settled };
}

export function loadGetterTupleMatchData(source: TupleReader) {
    const _exists = source.readBoolean();
    const _host = source.readAddress();
    const _guest = source.readAddress();
    const _stake = source.readBigNumber();
    const _rakeBps = source.readBigNumber();
    const _hostPaid = source.readBoolean();
    const _guestPaid = source.readBoolean();
    const _settled = source.readBoolean();
    return { $$type: 'MatchData' as const, exists: _exists, host: _host, guest: _guest, stake: _stake, rakeBps: _rakeBps, hostPaid: _hostPaid, guestPaid: _guestPaid, settled: _settled };
}

export function storeTupleMatchData(source: MatchData) {
    const builder = new TupleBuilder();
    builder.writeBoolean(source.exists);
    builder.writeAddress(source.host);
    builder.writeAddress(source.guest);
    builder.writeNumber(source.stake);
    builder.writeNumber(source.rakeBps);
    builder.writeBoolean(source.hostPaid);
    builder.writeBoolean(source.guestPaid);
    builder.writeBoolean(source.settled);
    return builder.build();
}

export function dictValueParserMatchData(): DictionaryValue<MatchData> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeMatchData(src)).endCell());
        },
        parse: (src) => {
            return loadMatchData(src.loadRef().beginParse());
        }
    }
}

export type DotWarsEscrow$Data = {
    $$type: 'DotWarsEscrow$Data';
    oracle: Address;
    treasury: Address;
    matches: Dictionary<bigint, MatchData>;
}

export function storeDotWarsEscrow$Data(src: DotWarsEscrow$Data) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.oracle);
        b_0.storeAddress(src.treasury);
        b_0.storeDict(src.matches, Dictionary.Keys.BigUint(256), dictValueParserMatchData());
    };
}

export function loadDotWarsEscrow$Data(slice: Slice) {
    const sc_0 = slice;
    const _oracle = sc_0.loadAddress();
    const _treasury = sc_0.loadAddress();
    const _matches = Dictionary.load(Dictionary.Keys.BigUint(256), dictValueParserMatchData(), sc_0);
    return { $$type: 'DotWarsEscrow$Data' as const, oracle: _oracle, treasury: _treasury, matches: _matches };
}

export function loadTupleDotWarsEscrow$Data(source: TupleReader) {
    const _oracle = source.readAddress();
    const _treasury = source.readAddress();
    const _matches = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserMatchData(), source.readCellOpt());
    return { $$type: 'DotWarsEscrow$Data' as const, oracle: _oracle, treasury: _treasury, matches: _matches };
}

export function loadGetterTupleDotWarsEscrow$Data(source: TupleReader) {
    const _oracle = source.readAddress();
    const _treasury = source.readAddress();
    const _matches = Dictionary.loadDirect(Dictionary.Keys.BigUint(256), dictValueParserMatchData(), source.readCellOpt());
    return { $$type: 'DotWarsEscrow$Data' as const, oracle: _oracle, treasury: _treasury, matches: _matches };
}

export function storeTupleDotWarsEscrow$Data(source: DotWarsEscrow$Data) {
    const builder = new TupleBuilder();
    builder.writeAddress(source.oracle);
    builder.writeAddress(source.treasury);
    builder.writeCell(source.matches.size > 0 ? beginCell().storeDictDirect(source.matches, Dictionary.Keys.BigUint(256), dictValueParserMatchData()).endCell() : null);
    return builder.build();
}

export function dictValueParserDotWarsEscrow$Data(): DictionaryValue<DotWarsEscrow$Data> {
    return {
        serialize: (src, builder) => {
            builder.storeRef(beginCell().store(storeDotWarsEscrow$Data(src)).endCell());
        },
        parse: (src) => {
            return loadDotWarsEscrow$Data(src.loadRef().beginParse());
        }
    }
}

 type DotWarsEscrow_init_args = {
    $$type: 'DotWarsEscrow_init_args';
    oracle: Address;
    treasury: Address;
}

function initDotWarsEscrow_init_args(src: DotWarsEscrow_init_args) {
    return (builder: Builder) => {
        const b_0 = builder;
        b_0.storeAddress(src.oracle);
        b_0.storeAddress(src.treasury);
    };
}

async function DotWarsEscrow_init(oracle: Address, treasury: Address) {
    const __code = Cell.fromHex('b5ee9c7241021c01000613000114ff00f4a413f4bcf2c80b01020162021104ccd001d072d721d200d200fa4021103450666f04f86102f862ed44d0d200019afa40fa40f40455206c1399fa40fa405902d1016de204925f04e002d70d1ff2e0822182104f50454ebae30221821047534554bae3022182104445504fbae30221821053544c45ba0304050703ea31d3fffa40fa00d30f3081540cf84226c705f2f482008b6f22c200f2f48200c559218107d0bbf2f45e5023db3c6c61820094a002b392307fdef2f420830750437f03db3c31103410374089707070c855705078ca0015ce13ce01fa02cb0fca00ca00ca00c94330206e953059f45b30944133f417e217191003e031d3fffa403081540cf84224c705f2f4541343db3c8200b5b7289221b39170e2f2f48108b622b3f2f450a982009df809db3c5270c70592367f94516dc705e219f2f4104b830750a9c855705078ca0015ce13ce01fa02cb0fca00ca00ca00c9103514206e953059f45b30944133f417e217191003e031d3ff30541233db3c8200b5b7289221b39170e2f2f48171bdf8416f24135f0326bef2f4f84227c7059a8200eb7b03b313f2f47f8eaa82009df802b312f2f44987db3c5250c7059334f8429c82009df8f84226c705f2f404e249145077087f01e21067105710471037102783075028c8171906007055705078ca0015ce13ce01fa02cb0fca00ca00ca00c9413015206e953059f45b30944133f417e212c87f01ca0055205023cecef400c9ed5403d6e30221821052464e44bae30221821052464e31bae302018210946a98b6ba8e45d33f30c8018210aff90f5758cb1fcb3fc913f84270705003804201503304c8cf8580ca00cf8440ce01fa02806acf40f400c901fb00c87f01ca0055205023cecef400c9ed54e05f04f2c082080b0d02fc31d3ffd3073081540cf84224c705f2f4541343db3c8200b5b7289201b3923170e2f2f48200c99e2291219170e2f2f4813a4a2cc103f2f4167f8307c82851485148514850d4433055705078ca0015ce13ce01fa02cb0fca00ca00ca00c910364590206e953059f45b30944133f417e222aa005208a8812710a9045177a128170903468f1c303636541455db3c4034db3cc87f01ca0055205023cecef400c9ed54e13307c0010f0f0a035c8e8932103410231025db3c8e8930103410231025db3ce25441135024db3cc87f01ca0055205023cecef400c9ed540f0f0f04f631d3ff30541233db3c8200b5b7289201b3923170e2f2f4814cd72291219170e2b3f2f4f842811db4531bc705917f945317c705e292317f945116c705e2f2f4018e8848765348db3c4876de8e8847655376db3c4765de553070707f471783075028c855705078ca0015ce13ce01fa02cb0fca00ca00ca00c9413015170f0f0c003e206e953059f45b30944133f417e212c87f01ca0055205023cecef400c9ed5404ea31d3fffa403081540cf84224c705f2f4541343db3c8200b5b7289221b39170e2f2f4814cd72391229170e2b3f2f453c6c70591229170e28e89323b48765348db3c70e30e10394800830750c8c855705078ca0015ce13ce01fa02cb0fca00ca00ca00c910354140206e953059f45b30944133f417e2170f0e1003644a98db3c5260c705b39451c5c705923c70e291289170e28f113847a327db3c597003db3c040850334b1bde108b1039408803190f19008020c101915be07072036d6d50436d5033c8cf8580ca00cf8440ce01fa028069cf40025c6e016eb0935bcf819d58cf8680cf8480f400f400cf81e2f400c901fb000020c87f01ca0055205023cecef400c9ed5402012012140145bee03f6a268690000cd7d207d207a022a903609ccfd207d202c816880b6f16d9e3618c13000222020162151a0149b0a5fb513434800066be903e903d0115481b04e67e903e901640b4405b789540b6cf1b0e20160104db3c17016c8307220259f40f6fa192306ddf206e92306d8e17d0d200fa40fa40fa00d30fd200d200d20055706c186f08e2206e8e8330db3ce06f2818022c597003db3c5520db3c702010471036707070108a1089191900488d08600000000000000000000000000000000000000000000000000000000000000000040145b3e8fb513434800066be903e903d0115481b04e67e903e901640b4405b78b6cf1b0c601b00022140e99692');
    const builder = beginCell();
    builder.storeUint(0, 1);
    initDotWarsEscrow_init_args({ $$type: 'DotWarsEscrow_init_args', oracle, treasury })(builder);
    const __data = builder.endCell();
    return { code: __code, data: __data };
}

export const DotWarsEscrow_errors = {
    2: { message: "Stack underflow" },
    3: { message: "Stack overflow" },
    4: { message: "Integer overflow" },
    5: { message: "Integer out of expected range" },
    6: { message: "Invalid opcode" },
    7: { message: "Type check error" },
    8: { message: "Cell overflow" },
    9: { message: "Cell underflow" },
    10: { message: "Dictionary error" },
    11: { message: "'Unknown' error" },
    12: { message: "Fatal error" },
    13: { message: "Out of gas error" },
    14: { message: "Virtualization error" },
    32: { message: "Action list is invalid" },
    33: { message: "Action list is too long" },
    34: { message: "Action is invalid or not supported" },
    35: { message: "Invalid source address in outbound message" },
    36: { message: "Invalid destination address in outbound message" },
    37: { message: "Not enough Toncoin" },
    38: { message: "Not enough extra currencies" },
    39: { message: "Outbound message does not fit into a cell after rewriting" },
    40: { message: "Cannot process a message" },
    41: { message: "Library reference is null" },
    42: { message: "Library change action error" },
    43: { message: "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree" },
    50: { message: "Account state size exceeded limits" },
    128: { message: "Null reference exception" },
    129: { message: "Invalid serialization prefix" },
    130: { message: "Invalid incoming message" },
    131: { message: "Constraints error" },
    132: { message: "Access denied" },
    133: { message: "Contract stopped" },
    134: { message: "Invalid argument" },
    135: { message: "Code of a contract was not found" },
    136: { message: "Invalid standard address" },
    138: { message: "Not a basechain address" },
    2230: { message: "paid" },
    7604: { message: "auth" },
    14922: { message: "outcome" },
    19671: { message: "locked" },
    21516: { message: "oracle" },
    29117: { message: "value" },
    35695: { message: "stake" },
    38048: { message: "open" },
    40440: { message: "guest" },
    46519: { message: "match" },
    50521: { message: "rake" },
    51614: { message: "lock" },
    60283: { message: "host" },
} as const

export const DotWarsEscrow_errors_backward = {
    "Stack underflow": 2,
    "Stack overflow": 3,
    "Integer overflow": 4,
    "Integer out of expected range": 5,
    "Invalid opcode": 6,
    "Type check error": 7,
    "Cell overflow": 8,
    "Cell underflow": 9,
    "Dictionary error": 10,
    "'Unknown' error": 11,
    "Fatal error": 12,
    "Out of gas error": 13,
    "Virtualization error": 14,
    "Action list is invalid": 32,
    "Action list is too long": 33,
    "Action is invalid or not supported": 34,
    "Invalid source address in outbound message": 35,
    "Invalid destination address in outbound message": 36,
    "Not enough Toncoin": 37,
    "Not enough extra currencies": 38,
    "Outbound message does not fit into a cell after rewriting": 39,
    "Cannot process a message": 40,
    "Library reference is null": 41,
    "Library change action error": 42,
    "Exceeded maximum number of cells in the library or the maximum depth of the Merkle tree": 43,
    "Account state size exceeded limits": 50,
    "Null reference exception": 128,
    "Invalid serialization prefix": 129,
    "Invalid incoming message": 130,
    "Constraints error": 131,
    "Access denied": 132,
    "Contract stopped": 133,
    "Invalid argument": 134,
    "Code of a contract was not found": 135,
    "Invalid standard address": 136,
    "Not a basechain address": 138,
    "paid": 2230,
    "auth": 7604,
    "outcome": 14922,
    "locked": 19671,
    "oracle": 21516,
    "value": 29117,
    "stake": 35695,
    "open": 38048,
    "guest": 40440,
    "match": 46519,
    "rake": 50521,
    "lock": 51614,
    "host": 60283,
} as const

const DotWarsEscrow_types: ABIType[] = [
    {"name":"DataSize","header":null,"fields":[{"name":"cells","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bits","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"refs","type":{"kind":"simple","type":"int","optional":false,"format":257}}]},
    {"name":"SignedBundle","header":null,"fields":[{"name":"signature","type":{"kind":"simple","type":"fixed-bytes","optional":false,"format":64}},{"name":"signedData","type":{"kind":"simple","type":"slice","optional":false,"format":"remainder"}}]},
    {"name":"StateInit","header":null,"fields":[{"name":"code","type":{"kind":"simple","type":"cell","optional":false}},{"name":"data","type":{"kind":"simple","type":"cell","optional":false}}]},
    {"name":"Context","header":null,"fields":[{"name":"bounceable","type":{"kind":"simple","type":"bool","optional":false}},{"name":"sender","type":{"kind":"simple","type":"address","optional":false}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"raw","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"SendParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"code","type":{"kind":"simple","type":"cell","optional":true}},{"name":"data","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"MessageParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"to","type":{"kind":"simple","type":"address","optional":false}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DeployParameters","header":null,"fields":[{"name":"mode","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"body","type":{"kind":"simple","type":"cell","optional":true}},{"name":"value","type":{"kind":"simple","type":"int","optional":false,"format":257}},{"name":"bounce","type":{"kind":"simple","type":"bool","optional":false}},{"name":"init","type":{"kind":"simple","type":"StateInit","optional":false}}]},
    {"name":"StdAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":8}},{"name":"address","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"VarAddress","header":null,"fields":[{"name":"workchain","type":{"kind":"simple","type":"int","optional":false,"format":32}},{"name":"address","type":{"kind":"simple","type":"slice","optional":false}}]},
    {"name":"BasechainAddress","header":null,"fields":[{"name":"hash","type":{"kind":"simple","type":"int","optional":true,"format":257}}]},
    {"name":"Deploy","header":2490013878,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"DeployOk","header":2952335191,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}}]},
    {"name":"FactoryDeploy","header":1829761339,"fields":[{"name":"queryId","type":{"kind":"simple","type":"uint","optional":false,"format":64}},{"name":"cashback","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"OpenMatch","header":1330660686,"fields":[{"name":"matchId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"host","type":{"kind":"simple","type":"address","optional":false}},{"name":"stake","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"rakeBps","type":{"kind":"simple","type":"uint","optional":false,"format":16}}]},
    {"name":"SetGuest","header":1196639572,"fields":[{"name":"matchId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"guest","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"Deposit","header":1145393231,"fields":[{"name":"matchId","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"Settle","header":1398033477,"fields":[{"name":"matchId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"outcome","type":{"kind":"simple","type":"uint","optional":false,"format":8}}]},
    {"name":"Refund","header":1380339268,"fields":[{"name":"matchId","type":{"kind":"simple","type":"uint","optional":false,"format":256}}]},
    {"name":"RefundOne","header":1380339249,"fields":[{"name":"matchId","type":{"kind":"simple","type":"uint","optional":false,"format":256}},{"name":"who","type":{"kind":"simple","type":"address","optional":false}}]},
    {"name":"MatchData","header":null,"fields":[{"name":"exists","type":{"kind":"simple","type":"bool","optional":false}},{"name":"host","type":{"kind":"simple","type":"address","optional":false}},{"name":"guest","type":{"kind":"simple","type":"address","optional":false}},{"name":"stake","type":{"kind":"simple","type":"uint","optional":false,"format":"coins"}},{"name":"rakeBps","type":{"kind":"simple","type":"uint","optional":false,"format":16}},{"name":"hostPaid","type":{"kind":"simple","type":"bool","optional":false}},{"name":"guestPaid","type":{"kind":"simple","type":"bool","optional":false}},{"name":"settled","type":{"kind":"simple","type":"bool","optional":false}}]},
    {"name":"DotWarsEscrow$Data","header":null,"fields":[{"name":"oracle","type":{"kind":"simple","type":"address","optional":false}},{"name":"treasury","type":{"kind":"simple","type":"address","optional":false}},{"name":"matches","type":{"kind":"dict","key":"uint","keyFormat":256,"value":"MatchData","valueFormat":"ref"}}]},
]

const DotWarsEscrow_opcodes = {
    "Deploy": 2490013878,
    "DeployOk": 2952335191,
    "FactoryDeploy": 1829761339,
    "OpenMatch": 1330660686,
    "SetGuest": 1196639572,
    "Deposit": 1145393231,
    "Settle": 1398033477,
    "Refund": 1380339268,
    "RefundOne": 1380339249,
}

const DotWarsEscrow_getters: ABIGetter[] = [
    {"name":"matchInfo","methodId":98967,"arguments":[{"name":"id","type":{"kind":"simple","type":"int","optional":false,"format":257}}],"returnType":{"kind":"simple","type":"MatchData","optional":false}},
    {"name":"oracle","methodId":89095,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
    {"name":"treasury","methodId":106403,"arguments":[],"returnType":{"kind":"simple","type":"address","optional":false}},
]

export const DotWarsEscrow_getterMapping: { [key: string]: string } = {
    'matchInfo': 'getMatchInfo',
    'oracle': 'getOracle',
    'treasury': 'getTreasury',
}

const DotWarsEscrow_receivers: ABIReceiver[] = [
    {"receiver":"internal","message":{"kind":"typed","type":"OpenMatch"}},
    {"receiver":"internal","message":{"kind":"typed","type":"SetGuest"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deposit"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Settle"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Refund"}},
    {"receiver":"internal","message":{"kind":"typed","type":"RefundOne"}},
    {"receiver":"internal","message":{"kind":"typed","type":"Deploy"}},
]


export class DotWarsEscrow implements Contract {
    
    public static readonly storageReserve = 0n;
    public static readonly errors = DotWarsEscrow_errors_backward;
    public static readonly opcodes = DotWarsEscrow_opcodes;
    
    static async init(oracle: Address, treasury: Address) {
        return await DotWarsEscrow_init(oracle, treasury);
    }
    
    static async fromInit(oracle: Address, treasury: Address) {
        const __gen_init = await DotWarsEscrow_init(oracle, treasury);
        const address = contractAddress(0, __gen_init);
        return new DotWarsEscrow(address, __gen_init);
    }
    
    static fromAddress(address: Address) {
        return new DotWarsEscrow(address);
    }
    
    readonly address: Address; 
    readonly init?: { code: Cell, data: Cell };
    readonly abi: ContractABI = {
        types:  DotWarsEscrow_types,
        getters: DotWarsEscrow_getters,
        receivers: DotWarsEscrow_receivers,
        errors: DotWarsEscrow_errors,
    };
    
    constructor(address: Address, init?: { code: Cell, data: Cell }) {
        this.address = address;
        this.init = init;
    }
    
    async send(provider: ContractProvider, via: Sender, args: { value: bigint, bounce?: boolean| null | undefined }, message: OpenMatch | SetGuest | Deposit | Settle | Refund | RefundOne | Deploy) {
        
        let body: Cell | null = null;
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'OpenMatch') {
            body = beginCell().store(storeOpenMatch(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'SetGuest') {
            body = beginCell().store(storeSetGuest(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deposit') {
            body = beginCell().store(storeDeposit(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Settle') {
            body = beginCell().store(storeSettle(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Refund') {
            body = beginCell().store(storeRefund(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'RefundOne') {
            body = beginCell().store(storeRefundOne(message)).endCell();
        }
        if (message && typeof message === 'object' && !(message instanceof Slice) && message.$$type === 'Deploy') {
            body = beginCell().store(storeDeploy(message)).endCell();
        }
        if (body === null) { throw new Error('Invalid message type'); }
        
        await provider.internal(via, { ...args, body: body });
        
    }
    
    async getMatchInfo(provider: ContractProvider, id: bigint) {
        const builder = new TupleBuilder();
        builder.writeNumber(id);
        const source = (await provider.get('matchInfo', builder.build())).stack;
        const result = loadGetterTupleMatchData(source);
        return result;
    }
    
    async getOracle(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('oracle', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
    async getTreasury(provider: ContractProvider) {
        const builder = new TupleBuilder();
        const source = (await provider.get('treasury', builder.build())).stack;
        const result = source.readAddress();
        return result;
    }
    
}