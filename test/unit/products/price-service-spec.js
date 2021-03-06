/**
 * [y] hybris Platform
 *
 * Copyright (c) 2000-2014 hybris AG
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of hybris
 * ("Confidential Information"). You shall not disclose such Confidential
 * Information and shall use it only in accordance with the terms of the
 * license agreement you entered into with hybris.
 */

describe('PricesService Test', function () {

    var $scope, $rootScope, $httpBackend, priceSvc, priceUrl, $q, deferredPricesForProducts;

    var priceResponse = {
        "prices": [
            {
                "price": 54.99,
                "productId": "DummyProduct",
                "currencyId": "USD",
                "priceId": "538c9f9edd8eff306aab5cf1"
            },
            {
                "price": 199.95,
                "productId": "AnotherDummyProduct",
                "currencyId": "USD",
                "priceId": "538c9fb7dd8eff306aab5d17"
            }
        ]
    };
    var pricesMap = {
        ID_productWithoutVariants: [
            { "productId": "ID_productWithoutVariants", "originalAmount": 70.5, "effectiveAmount": 70.5 }
        ],
        ID_productWithVariants: [
            { "productId": "ID_productWithVariants", "originalAmount": 70.5, "effectiveAmount": 70.5 },
            { "group": "ID_productWithVariants", "originalAmount": 10, "effectiveAmount": 10 },
            { "group": "ID_productWithVariants", "originalAmount": 20, "effectiveAmount": 20 },
            { "group": "ID_productWithVariants", "originalAmount": 30, "effectiveAmount": 30 }
        ],
        ID_productWithVariantsSales: [
            { "productId": "ID_productWithVariantsSales", "originalAmount": 70.5, "effectiveAmount": 70.5 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 30, "effectiveAmount": 10 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 20, "effectiveAmount": 10 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 10, "effectiveAmount": 10 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 20, "effectiveAmount": 20 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 30, "effectiveAmount": 20 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 60, "effectiveAmount": 20 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 50, "effectiveAmount": 30 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 40, "effectiveAmount": 30 },
            { "group": "ID_productWithVariantsSales", "originalAmount": 30, "effectiveAmount": 30 }
        ]
    }

    beforeEach(angular.mock.module('ds.products', function ($provide) {
        $provide.value('GlobalData', {});
        $provide.value('appConfig', {});

    }));

    beforeEach(function () {
        module('restangular');
        this.addMatchers({
            toEqualData: function (expected) {
                return angular.equals(this.actual, expected);
            }
        });

        inject(function (_$httpBackend_, _$rootScope_, _PriceSvc_, SiteConfigSvc, _$q_) {
            $rootScope = _$rootScope_;
            $scope = _$rootScope_.$new();
            siteConfig = SiteConfigSvc;
            priceUrl = siteConfig.apis.prices.baseUrl + 'prices';
            $httpBackend = _$httpBackend_;
            priceSvc = _PriceSvc_;
            $q = _$q_;
            deferredPricesForProducts = $q.defer();
            spyOn(priceSvc, 'getPricesForProducts').andReturn(deferredPricesForProducts.promise);
        });
    });

    it('query return prices object with success handler invoking callback on resolved promise', function () {
        $httpBackend.expectGET(priceUrl).respond(priceResponse);
        var prices = priceSvc.query({});
        $httpBackend.flush();
        expect(prices.$object.prices).toEqualData(priceResponse.prices);
    });


    it('getPricesMapForProduct should return singlePrice for product without variants', function () {
        priceSvc.getPricesMapForProducts([{ id: 'ID_productWithoutVariants' }], 'USD').then(function (prices) {
            expect(prices['ID_productWithoutVariants'].singlePrice).toEqual(
                { "productId": "ID_productWithoutVariants", "originalAmount": 70.5, "effectiveAmount": 70.5 }
            );
        });
        deferredPricesForProducts.resolve(pricesMap['ID_productWithoutVariants']);
        $scope.$digest();
    });

    it('getPricesMapForProduct should return minPrise and maxPrice for product with variants', function () {
        priceSvc.getPricesMapForProducts([{ id: 'ID_productWithVariants' }], 'USD').then(function (prices) {
            expect(prices['ID_productWithVariants'].singlePrice).toEqual(
                { "productId": "ID_productWithVariants", "originalAmount": 70.5, "effectiveAmount": 70.5 }
            );
            expect(prices['ID_productWithVariants'].minPrice).toEqual(
                { "group": "ID_productWithVariants", "originalAmount": 10, "effectiveAmount": 10 }
            );
            expect(prices['ID_productWithVariants'].maxPrice).toEqual(
                { "group": "ID_productWithVariants", "originalAmount": 30, "effectiveAmount": 30 }
            );
        });
        deferredPricesForProducts.resolve(pricesMap['ID_productWithVariants']);
        $scope.$digest();
    });

    it('getPricesMapForProduct should favour sale prices with the biggest discout', function () {
        priceSvc.getPricesMapForProducts([{ id: 'ID_productWithVariantsSales' }], 'USD').then(function (prices) {
            expect(prices['ID_productWithVariantsSales'].singlePrice).toEqual(
                { "productId": "ID_productWithVariantsSales", "originalAmount": 70.5, "effectiveAmount": 70.5 }
            );
            expect(prices['ID_productWithVariantsSales'].minPrice).toEqual(
                { "group": "ID_productWithVariantsSales", "originalAmount": 30, "effectiveAmount": 10 }
            );
            expect(prices['ID_productWithVariantsSales'].maxPrice).toEqual(
                { "group": "ID_productWithVariantsSales", "originalAmount": 50, "effectiveAmount": 30 }
            );
        });
        deferredPricesForProducts.resolve(pricesMap['ID_productWithVariantsSales']);
        $scope.$digest();
    });

});