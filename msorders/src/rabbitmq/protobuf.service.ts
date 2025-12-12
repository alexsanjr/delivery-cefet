import { Injectable, Logger } from '@nestjs/common';
import * as protobuf from 'protobufjs';
import { join } from 'path';

@Injectable()
export class ProtobufService {
  private readonly logger = new Logger(ProtobufService.name);
  private roots: Map<string, protobuf.Root> = new Map();

  /**
   * Carrega um arquivo .proto
   * @param protoPath Caminho relativo ao diretório src/grpc
   * @returns Root do protobuf
   */
  async loadProto(protoPath: string): Promise<protobuf.Root> {
    try {
      if (this.roots.has(protoPath)) {
        return this.roots.get(protoPath)!;
      }

      const fullPath = join(__dirname, '../grpc', protoPath);
      this.logger.log(`Loading proto file: ${fullPath}`);

      const root = await protobuf.load(fullPath);
      this.roots.set(protoPath, root);

      this.logger.log(`Proto file loaded: ${protoPath}`);
      return root;
    } catch (error) {
      this.logger.error(`Failed to load proto file: ${protoPath}`, error);
      throw error;
    }
  }

  /**
   * Serializa um objeto usando Protobuf
   * @param root Root do protobuf
   * @param messageName Nome da mensagem (ex: "customers.Customer")
   * @param data Dados a serem serializados
   * @returns Buffer serializado
   */
  serialize(root: protobuf.Root, messageName: string, data: any): Buffer {
    try {
      const MessageType = root.lookupType(messageName);

      this.logger.debug(`Input data: ${JSON.stringify(data)}`);

      const errMsg = MessageType.verify(data);
      if (errMsg) {
        throw new Error(`Validation error: ${errMsg}`);
      }

      const message = MessageType.create(data);
      this.logger.debug(`Created message: ${JSON.stringify(message)}`);

      const buffer = MessageType.encode(message).finish();

      this.logger.log(
        `Serialized ${messageName} (${buffer.length} bytes)`,
      );

      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error(`Failed to serialize ${messageName}`, error);
      throw error;
    }
  }

  /**
   * Desserializa um Buffer usando Protobuf
   * @param root Root do protobuf
   * @param messageName Nome da mensagem
   * @param buffer Buffer a ser desserializado
   * @returns Objeto desserializado
   */
  deserialize<T = any>(
    root: protobuf.Root,
    messageName: string,
    buffer: Buffer,
  ): T {
    try {
      const MessageType = root.lookupType(messageName);

      // Desserializa o buffer
      const message = MessageType.decode(buffer);

      // Converte para objeto JavaScript
      const object = MessageType.toObject(message, {
        longs: String,
        enums: String,
        bytes: String,
        defaults: true,
        arrays: true,
        objects: true,
        oneofs: true,
      });

      this.logger.debug(`Deserialized ${messageName} (${buffer.length} bytes)`);

      return object as T;
    } catch (error) {
      this.logger.error(`Failed to deserialize ${messageName}`, error);
      throw error;
    }
  }

  /**
   * Cria um serializador/desserializador para um tipo específico
   */
  async createCodec<T = any>(protoPath: string, messageName: string) {
    const root = await this.loadProto(protoPath);

    return {
      serialize: (data: T): Buffer => {
        return this.serialize(root, messageName, data);
      },
      deserialize: (buffer: Buffer): T => {
        return this.deserialize<T>(root, messageName, buffer);
      },
    };
  }
}
