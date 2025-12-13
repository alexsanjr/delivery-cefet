import * as protobuf from 'protobufjs';
import * as path from 'path';

export interface ProtobufSerializer {
  serialize<T extends object>(messageName: string, data: T): Buffer;
  deserialize<T extends object>(messageName: string, buffer: Buffer): T;
}

export class ProtobufSerializerImpl implements ProtobufSerializer {
  private root: protobuf.Root | null = null;
  private loadPromise: Promise<void> | null = null;

  constructor(private readonly protoPath: string | string[]) {}

  private async ensureLoaded(): Promise<void> {
    if (this.root) return;

    if (!this.loadPromise) {
      this.loadPromise = this.loadProto();
    }

    await this.loadPromise;
  }

  private async loadProto(): Promise<void> {
    const protoPaths = Array.isArray(this.protoPath) ? this.protoPath : [this.protoPath];
    
    this.root = new protobuf.Root();
    
    for (const protoPath of protoPaths) {
      const absolutePath = path.isAbsolute(protoPath)
        ? protoPath
        : path.join(process.cwd(), protoPath);

      await this.root.load(absolutePath, { keepCase: true });
    }
  }

  serialize<T extends object>(messageName: string, data: T): Buffer {
    if (!this.root) {
      throw new Error('Proto not loaded. Call ensureLoaded() first.');
    }

    const MessageType = this.root.lookupType(messageName);
    const errMsg = MessageType.verify(data);
    
    if (errMsg) {
      throw new Error(`Protobuf verification failed: ${errMsg}`);
    }

    const message = MessageType.create(data);
    return Buffer.from(MessageType.encode(message).finish());
  }

  deserialize<T extends object>(messageName: string, buffer: Buffer): T {
    if (!this.root) {
      throw new Error('Proto not loaded. Call ensureLoaded() first.');
    }

    const MessageType = this.root.lookupType(messageName);
    const message = MessageType.decode(buffer);
    return MessageType.toObject(message, {
      longs: Number,
      enums: String,
      bytes: Buffer,
      defaults: true,
      oneofs: true,
    }) as T;
  }

  async initialize(): Promise<void> {
    await this.ensureLoaded();
  }

  serializeSync<T extends object>(messageName: string, data: T): Buffer {
    return this.serialize(messageName, data);
  }

  deserializeSync<T extends object>(messageName: string, buffer: Buffer): T {
    return this.deserialize(messageName, buffer);
  }
}
