import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { DeliveryPersonsService } from './delivery-persons.service';
import { CreateDeliveryPersonInput } from './dto/create-delivery-person.input';
import { UpdateDeliveryPersonInput } from './dto/update-delivery-person.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { DeliveryPersonStatus } from './models/delivery-person-status.enum';

@ApiTags('delivery-persons')
@Controller('delivery-persons')
export class DeliveryPersonsController {
  constructor(private readonly deliveryPersonsService: DeliveryPersonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo entregador' })
  @ApiResponse({ status: 201, description: 'Entregador criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(@Body() createDeliveryPersonInput: CreateDeliveryPersonInput) {
    return this.deliveryPersonsService.create(createDeliveryPersonInput);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os entregadores' })
  @ApiResponse({ status: 200, description: 'Lista de entregadores' })
  @ApiQuery({ name: 'status', required: false, enum: DeliveryPersonStatus })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  findAll(
    @Query('status') status?: DeliveryPersonStatus,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.deliveryPersonsService.findAll(status, isActiveBoolean);
  }

  @Get('available-nearby')
  @ApiOperation({ summary: 'Buscar entregadores disponíveis próximos' })
  @ApiResponse({ status: 200, description: 'Lista de entregadores disponíveis' })
  @ApiQuery({ name: 'latitude', required: true, type: Number, example: -19.9191 })
  @ApiQuery({ name: 'longitude', required: true, type: Number, example: -43.9386 })
  @ApiQuery({ name: 'radiusKm', required: true, type: Number, example: 5 })
  findAvailableNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radiusKm') radiusKm: string,
  ) {
    return this.deliveryPersonsService.findAvailableNearby(
      parseFloat(latitude),
      parseFloat(longitude),
      parseFloat(radiusKm),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar entregador por ID' })
  @ApiResponse({ status: 200, description: 'Entregador encontrado' })
  @ApiResponse({ status: 404, description: 'Entregador não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do entregador' })
  findOne(@Param('id') id: string) {
    return this.deliveryPersonsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados do entregador' })
  @ApiResponse({ status: 200, description: 'Entregador atualizado' })
  @ApiResponse({ status: 404, description: 'Entregador não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do entregador' })
  update(
    @Param('id') id: string,
    @Body() updateDeliveryPersonInput: UpdateDeliveryPersonInput,
  ) {
    return this.deliveryPersonsService.update(id, updateDeliveryPersonInput);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desativar entregador (soft delete)' })
  @ApiResponse({ status: 200, description: 'Entregador desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Entregador não encontrado' })
  @ApiResponse({ status: 400, description: 'Entregador já está desativado' })
  @ApiParam({ name: 'id', description: 'ID do entregador' })
  deactivate(@Param('id') id: string) {
    return this.deliveryPersonsService.deactivate(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Ativar entregador' })
  @ApiResponse({ status: 200, description: 'Entregador ativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Entregador não encontrado' })
  @ApiResponse({ status: 400, description: 'Entregador já está ativo' })
  @ApiParam({ name: 'id', description: 'ID do entregador' })
  activate(@Param('id') id: string) {
    return this.deliveryPersonsService.activate(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover entregador permanentemente (hard delete)' })
  @ApiResponse({ status: 204, description: 'Entregador removido permanentemente' })
  @ApiResponse({ status: 404, description: 'Entregador não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do entregador' })
  remove(@Param('id') id: string) {
    return this.deliveryPersonsService.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Atualizar status do entregador' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 404, description: 'Entregador não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do entregador' })
  updateStatus(@Param('id') id: string, @Body() body: { status: DeliveryPersonStatus }) {
    return this.deliveryPersonsService.updateStatus({
      deliveryPersonId: id,
      status: body.status,
    });
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Atualizar localização do entregador' })
  @ApiResponse({ status: 200, description: 'Localização atualizada' })
  @ApiResponse({ status: 404, description: 'Entregador não encontrado' })
  @ApiParam({ name: 'id', description: 'ID do entregador' })
  updateLocation(@Param('id') id: string, @Body() updateLocationInput: Omit<UpdateLocationInput, 'deliveryPersonId'>) {
    return this.deliveryPersonsService.updateLocation({
      deliveryPersonId: id,
      ...updateLocationInput,
    });
  }
}
