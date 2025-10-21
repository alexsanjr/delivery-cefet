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
import { DeliveryPersonsService } from './delivery-persons.service';
import { CreateDeliveryPersonInput } from './dto/create-delivery-person.input';
import { UpdateDeliveryPersonInput } from './dto/update-delivery-person.input';
import { UpdateStatusInput } from './dto/update-status.input';
import { UpdateLocationInput } from './dto/update-location.input';
import { DeliveryPersonStatus } from '@prisma/client';

@Controller('delivery-persons')
export class DeliveryPersonsController {
  constructor(private readonly deliveryPersonsService: DeliveryPersonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDeliveryPersonInput: CreateDeliveryPersonInput) {
    return this.deliveryPersonsService.create(createDeliveryPersonInput);
  }

  @Get()
  findAll(
    @Query('status') status?: DeliveryPersonStatus,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.deliveryPersonsService.findAll(status, isActiveBoolean);
  }

  @Get('available-nearby')
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
  findOne(@Param('id') id: string) {
    return this.deliveryPersonsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDeliveryPersonInput: UpdateDeliveryPersonInput,
  ) {
    return this.deliveryPersonsService.update(id, updateDeliveryPersonInput);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.deliveryPersonsService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: { status: DeliveryPersonStatus }) {
    return this.deliveryPersonsService.updateStatus({
      deliveryPersonId: id,
      status: body.status,
    });
  }

  @Patch(':id/location')
  updateLocation(@Param('id') id: string, @Body() updateLocationInput: Omit<UpdateLocationInput, 'deliveryPersonId'>) {
    return this.deliveryPersonsService.updateLocation({
      deliveryPersonId: id,
      ...updateLocationInput,
    });
  }
}
