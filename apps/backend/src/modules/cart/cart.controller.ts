import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import {
  AddItemDto,
  UpdateQtyDto,
  RemoveItemDto,
  ConfirmCartDto,
} from './dto/cart.dto';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  /**
   * POST /cart/add-item
   * Adicionar item ao carrinho
   */
  @Post('add-item')
  @HttpCode(HttpStatus.OK)
  async addItem(@Body() dto: AddItemDto) {
    return this.cartService.addItem(dto);
  }

  /**
   * GET /cart/:tenantId/:chatId
   * Obter carrinho atual
   */
  @Get(':tenantId/:chatId')
  async getCart(
    @Param('tenantId') tenantId: string,
    @Param('chatId') chatId: string,
  ) {
    return this.cartService.getCart(tenantId, chatId);
  }

  /**
   * POST /cart/update-qty
   * Atualizar quantidade de item
   */
  @Post('update-qty')
  @HttpCode(HttpStatus.OK)
  async updateQty(@Body() dto: UpdateQtyDto) {
    return this.cartService.updateQty(dto);
  }

  /**
   * POST /cart/remove-item
   * Remover item do carrinho
   */
  @Post('remove-item')
  @HttpCode(HttpStatus.OK)
  async removeItem(@Body() dto: RemoveItemDto) {
    return this.cartService.removeItem(dto);
  }

  /**
   * POST /cart/confirm
   * Confirmar pedido (salvar no banco)
   *
   * Body:
   * {
   *   chatId: "chat-id",
   *   contactId: "contact-id",
   *   tenantId: "tenant-id",
   *   notes?: "Sem gelo, por favor",
   *   vendorMode?: "SELLER"
   * }
   */
  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  async confirmCart(@Body() dto: ConfirmCartDto) {
    return this.cartService.confirmCart(dto);
  }

  /**
   * DELETE /cart/:tenantId/:chatId
   * Limpar carrinho
   */
  @Delete(':tenantId/:chatId')
  @HttpCode(HttpStatus.OK)
  async clearCart(
    @Param('tenantId') tenantId: string,
    @Param('chatId') chatId: string,
  ) {
    await this.cartService.clearCart(tenantId, chatId);
    return { success: true, message: 'Carrinho limpo' };
  }
}
