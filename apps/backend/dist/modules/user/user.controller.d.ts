import { UserService } from './user.service';
import { UserCreateDto, UserPreferencesDto } from './dto/user.dto';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    createUser(dto: UserCreateDto): Promise<import("./dto/user.dto").UserResponseDto>;
    getUser(id: string): Promise<any>;
    getUserByEmail(email: string): Promise<any>;
    updatePreferences(userId: string, dto: UserPreferencesDto): Promise<any>;
    activateUser(userId: string): Promise<import("./dto/user.dto").UserResponseDto>;
}
